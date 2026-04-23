-- ============================================================================
-- Phase 3B: Embeddings + ranking
--
-- Adds:
--   1. user_embedding vector column on user_news_preferences
--   2. rank_news_for_user() SQL function that returns scored articles
--
-- The articles.embedding column already exists (from Phase 1 schema), it's
-- just been null until now. Phase 3B populates it.
-- ============================================================================

-- Ensure pgvector is available (no-op if already enabled)
create extension if not exists vector;

-- User's interest vector. Refreshed daily by cron and on profile save.
-- Separate from geography_tags etc. because it captures nuance beyond
-- structured tags (thesis prose, free-text focus areas, etc.).
alter table user_news_preferences
  add column if not exists user_embedding vector(1536),
  add column if not exists embedding_updated_at timestamptz;

-- ============================================================================
-- rank_news_for_user
-- ============================================================================
-- Returns articles scored and ordered by personalized rank for one user.
--
-- Score composition:
--   0.40 * semantic similarity (cosine, clamped to [0,1])
--   0.25 * recency (exponential decay, 48-hour half-life)
--   0.15 * credibility (tier 1 = 1.0, tier 2 = 0.67, tier 3 = 0.33)
--   0.15 * saved-company boost (1.0 if article mentions a saved company,
--          higher for stages closer to deal closing)
--   0.05 * interaction signal (thumbs_up adds, dismiss subtracts)
--
-- Semantic similarity requires the user has an embedding — if not, that
-- portion is treated as neutral (0.5) so ranking still works but degrades
-- to recency+credibility+signals for users who haven't set preferences yet.
-- ============================================================================
create or replace function rank_news_for_user(
  p_clerk_user_id text,
  p_limit int default 50,
  p_offset int default 0,
  p_max_age_days int default 14
)
returns table (
  id                         bigint,
  title                      text,
  url                        text,
  summary_factual            text,
  excerpt                    text,
  published_at               timestamptz,
  image_url                  text,
  classification             text,
  geography_tags             text[],
  sector_tags                text[],
  is_secondary_source        boolean,
  primary_source_attribution text,
  source_id                  bigint,
  source_name                text,
  source_slug                text,
  source_homepage_url        text,
  source_attribution_label   text,
  source_credibility_tier    int,
  score                      float,
  score_semantic             float,
  score_recency              float,
  score_credibility          float,
  score_pipeline             float,
  score_interaction          float
)
language plpgsql
stable
as $$
declare
  v_user_embedding vector(1536);
  v_has_embedding boolean := false;
begin
  -- Load the user's embedding once (may be null if no prefs set yet)
  select user_embedding into v_user_embedding
  from user_news_preferences
  where clerk_user_id = p_clerk_user_id;

  v_has_embedding := v_user_embedding is not null;

  return query
  with saved_company_ids as (
    -- Saved companies with stage weighting. Closer-to-closing stages
    -- boost matching articles more. Using fixed weights here; they can
    -- be tuned or exposed as user settings later.
    select
      company_id,
      case stage
        when 'in_diligence' then 1.00
        when 'diligence'    then 1.00  -- legacy name
        when 'contacted'    then 0.80
        when 'watching'     then 0.60
        when 'passed'       then 0.00
        else                     0.40
      end as weight
    from user_saved_companies
    where clerk_user_id = p_clerk_user_id
      and stage != 'passed'
  ),
  interaction_scores as (
    -- Rough signal: thumbs up or save adds, dismiss or thumb down subtracts.
    -- Aggregated per article so a user who engaged multiple ways with one
    -- article gets a single stable signal.
    select
      article_id,
      greatest(
        -0.5,
        least(
          0.5,
          sum(case action
            when 'thumb_up'  then  0.4
            when 'save'      then  0.3
            when 'click_out' then  0.1
            when 'view'      then  0.0
            when 'thumb_down' then -0.4
            when 'dismiss'   then -0.3
            else 0.0
          end)
        )
      ) as signal
    from user_news_interactions
    where clerk_user_id = p_clerk_user_id
    group by article_id
  ),
  scored as (
    select
      a.id,
      a.title,
      a.url,
      a.summary_factual,
      a.excerpt,
      a.published_at,
      a.image_url,
      a.classification,
      a.geography_tags,
      a.sector_tags,
      a.is_secondary_source,
      a.primary_source_attribution,
      s.id as source_id,
      s.name as source_name,
      s.slug as source_slug,
      s.homepage_url as source_homepage_url,
      s.attribution_label as source_attribution_label,
      s.credibility_tier as source_credibility_tier,
      -- Semantic similarity: cosine similarity is 1 - cosine_distance.
      -- pgvector's <=> operator returns cosine distance in [0, 2].
      -- We clamp to [0, 1] since negative similarity isn't meaningful here.
      case
        when v_has_embedding and a.embedding is not null then
          greatest(0.0, least(1.0, 1.0 - (a.embedding <=> v_user_embedding) / 2.0))
        else 0.5  -- neutral when either side has no embedding
      end as score_semantic,
      -- Recency: exponential decay with 48-hour half-life
      case
        when a.published_at is null then 0.3
        else exp(
          -ln(2) * extract(epoch from (now() - a.published_at)) / (48.0 * 3600.0)
        )
      end as score_recency,
      -- Credibility: tier 1 = 1.0, tier 2 = 0.67, tier 3 = 0.33
      case coalesce(s.credibility_tier, 2)
        when 1 then 1.00
        when 2 then 0.67
        when 3 then 0.33
        else        0.50
      end as score_credibility,
      -- Pipeline boost: does this article mention any of the user's saved companies?
      -- Join via news_entities where entity_type = 'company' and name matches.
      coalesce((
        select max(sci.weight)
        from news_entities ne
        join companies c on lower(c.name) = lower(ne.entity_name)
        join saved_company_ids sci on sci.company_id = c.id
        where ne.article_id = a.id
          and ne.entity_type = 'company'
      ), 0.0) as score_pipeline,
      coalesce(iscore.signal, 0.0) as score_interaction
    from news_articles a
    left join news_sources s on s.id = a.source_id
    left join interaction_scores iscore on iscore.article_id = a.id
    where a.enrichment_status = 'done'
      and a.published_at > now() - (p_max_age_days || ' days')::interval
      -- Exclude articles the user dismissed or thumbed down
      and not exists (
        select 1 from user_news_interactions uni
        where uni.article_id = a.id
          and uni.clerk_user_id = p_clerk_user_id
          and uni.action in ('dismiss', 'thumb_down')
      )
  )
  select
    scored.id, scored.title, scored.url, scored.summary_factual, scored.excerpt,
    scored.published_at, scored.image_url, scored.classification,
    scored.geography_tags, scored.sector_tags, scored.is_secondary_source,
    scored.primary_source_attribution,
    scored.source_id, scored.source_name, scored.source_slug,
    scored.source_homepage_url, scored.source_attribution_label,
    scored.source_credibility_tier,
    (
        0.40 * scored.score_semantic
      + 0.25 * scored.score_recency
      + 0.15 * scored.score_credibility
      + 0.15 * scored.score_pipeline
      + 0.05 * scored.score_interaction
    ) as score,
    scored.score_semantic, scored.score_recency, scored.score_credibility,
    scored.score_pipeline, scored.score_interaction
  from scored
  order by score desc, published_at desc nulls last
  limit p_limit
  offset p_offset;
end;
$$;

comment on function rank_news_for_user is
  'Returns articles ranked by personalized score for a given Clerk user. '
  'Score is a weighted sum of semantic similarity, recency, credibility, '
  'pipeline matches, and interaction signals. Degrades gracefully when '
  'the user has no embedding yet.';
