-- ============================================================================
-- Phase 4B: Policy ranking + related articles SQL functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- rank_policies_for_user
--
-- Returns policies ranked by relevance for a given user. Simpler than the
-- news ranking since policies change state slowly — we don't need fine-
-- grained recency decay. The emphasis is sector match.
--
-- Score composition:
--   0.55 * sector match (overlap between user's sectors and policy.sectors)
--   0.20 * recency (30-day half-life, much slower than news's 48h)
--   0.15 * jurisdiction relevance (US-heavy users get US boost, etc.)
--   0.10 * status weight (proposed/comment open > enacted > in_force)
-- ----------------------------------------------------------------------------
create or replace function rank_policies_for_user(
  p_clerk_user_id text,
  p_limit int default 50,
  p_offset int default 0,
  p_status_filter text default null,
  p_jurisdiction_filter text default null
)
returns table (
  id                      bigint,
  title                   text,
  jurisdiction            text,
  agency                  text,
  status                  text,
  document_type           text,
  published_at            timestamptz,
  effective_date          date,
  comment_deadline        date,
  sectors                 text[],
  affected_company_types  text[],
  investor_implications   text,
  source_url              text,
  score                   float,
  score_sector            float,
  score_recency           float,
  score_jurisdiction      float,
  score_status            float
)
language plpgsql
stable
as $$
declare
  v_user_sectors text[];
  v_user_geos text[];
begin
  -- Load user's sector and geography preferences
  select sectors, geographies
    into v_user_sectors, v_user_geos
  from user_news_preferences
  where clerk_user_id = p_clerk_user_id;

  v_user_sectors := coalesce(v_user_sectors, array[]::text[]);
  v_user_geos := coalesce(v_user_geos, array[]::text[]);

  return query
  with scored as (
    select
      p.id,
      p.title,
      p.jurisdiction,
      p.agency,
      p.status,
      p.document_type,
      p.published_at,
      p.effective_date,
      p.comment_deadline,
      p.sectors,
      p.affected_company_types,
      p.investor_implications,
      p.source_url,
      -- Sector match: Jaccard-like overlap. Full credit if any overlap,
      -- scaled by how much of the user's focus matches.
      (case
        when array_length(v_user_sectors, 1) is null or v_user_sectors = array[]::text[] then 0.5
        when p.sectors is null or p.sectors = array[]::text[] then 0.3
        else
          least(1.0, (
            cardinality(array(
              select unnest(v_user_sectors) intersect select unnest(p.sectors)
            ))::float
            / greatest(1, least(cardinality(v_user_sectors), cardinality(p.sectors)))
          ))
      end)::float as score_sector,
      -- Recency: 30-day half-life. A 30-day-old policy scores 0.5, a 90-day-old one 0.125.
      (case
        when p.published_at is null then 0.3
        else exp(-ln(2) * extract(epoch from (now() - p.published_at)) / (30.0 * 86400.0))
      end)::float as score_recency,
      -- Jurisdiction: crude match. If user has no geo set, neutral. Otherwise
      -- boost policies in jurisdictions that appear in their focus regions.
      (case
        when array_length(v_user_geos, 1) is null or v_user_geos = array[]::text[] then 0.5
        when p.jurisdiction is null then 0.4
        when exists (
          select 1 from unnest(v_user_geos) g
          where lower(g) = lower(p.jurisdiction) or lower(g) like lower(p.jurisdiction) || '%'
        ) then 1.0
        else 0.3
      end)::float as score_jurisdiction,
      -- Status: what-to-act-on-now weighting
      (case p.status
        when 'proposed'                  then 1.00
        when 'comment_period'            then 1.00
        when 'enacted_pending_effective' then 0.80
        when 'enacted'                   then 0.70
        when 'in_force'                  then 0.50
        when 'implemented'               then 0.50
        when 'amended'                   then 0.60
        when 'withdrawn'                 then 0.20
        when 'expired'                   then 0.15
        when 'superseded'                then 0.15
        when 'notice'                    then 0.25
        else                                  0.40
      end)::float as score_status
    from policies p
    where p.enrichment_status = 'done'
      and (p_status_filter is null or p.status = p_status_filter)
      and (p_jurisdiction_filter is null or p.jurisdiction = p_jurisdiction_filter)
  )
  select
    scored.id, scored.title, scored.jurisdiction, scored.agency, scored.status,
    scored.document_type, scored.published_at, scored.effective_date,
    scored.comment_deadline, scored.sectors, scored.affected_company_types,
    scored.investor_implications, scored.source_url,
    (
        0.55 * scored.score_sector
      + 0.20 * scored.score_recency
      + 0.15 * scored.score_jurisdiction
      + 0.10 * scored.score_status
    )::float as score,
    scored.score_sector, scored.score_recency, scored.score_jurisdiction,
    scored.score_status
  from scored
  order by score desc, published_at desc nulls last
  limit p_limit
  offset p_offset;
end;
$$;

-- ----------------------------------------------------------------------------
-- find_related_articles_for_policy
--
-- Given a policy ID, returns news articles that are plausibly "about" this
-- policy. Three signals combined:
--   1. Article's news_entities entry matches the policy title/docket
--   2. Article's classification is 'policy' or 'regulatory'
--   3. Article's sector_tags overlap with the policy's sectors
--
-- Matching is approximate — we're not doing semantic search here because it
-- would require recomputing embeddings comparison which is expensive per-
-- request. This is "good enough" article discovery; users can always search.
-- ----------------------------------------------------------------------------
create or replace function find_related_articles_for_policy(
  p_policy_id bigint,
  p_limit int default 10
)
returns table (
  id                         bigint,
  title                      text,
  url                        text,
  summary_factual            text,
  published_at               timestamptz,
  source_name                text,
  source_slug                text,
  classification             text,
  match_reason               text
)
language plpgsql
stable
as $$
declare
  v_policy_title text;
  v_policy_docket text;
  v_policy_sectors text[];
  v_policy_agency text;
begin
  select p.title, p.docket_id, p.sectors, p.agency
    into v_policy_title, v_policy_docket, v_policy_sectors, v_policy_agency
  from policies p
  where p.id = p_policy_id;

  if v_policy_title is null then return; end if;

  return query
  with candidates as (
    -- Signal 1: entity-based match via news_entities (policy or agency name in article entities)
    select
      a.id, a.title, a.url, a.summary_factual, a.published_at,
      s.name as source_name, s.slug as source_slug, a.classification,
      'entity_match'::text as match_reason,
      3.0::float as score
    from news_articles a
    left join news_sources s on s.id = a.source_id
    join news_entities ne on ne.article_id = a.id
    where a.enrichment_status = 'done'
      and (
        (ne.entity_type = 'policy' and ne.entity_name ilike '%' || substring(v_policy_title from 1 for 40) || '%')
        or (ne.entity_type = 'agency' and ne.entity_name ilike '%' || v_policy_agency || '%')
      )

    union all

    -- Signal 2: classification = policy or regulatory + sector overlap
    select
      a.id, a.title, a.url, a.summary_factual, a.published_at,
      s.name as source_name, s.slug as source_slug, a.classification,
      'sector_classification_match'::text as match_reason,
      1.5::float as score
    from news_articles a
    left join news_sources s on s.id = a.source_id
    where a.enrichment_status = 'done'
      and a.classification in ('policy', 'regulatory')
      and v_policy_sectors is not null
      and a.sector_tags && v_policy_sectors  -- array overlap operator
  ),
  dedup as (
    select distinct on (id)
      id, title, url, summary_factual, published_at,
      source_name, source_slug, classification, match_reason
    from candidates
    order by id, score desc, published_at desc
  )
  select
    dedup.id, dedup.title, dedup.url, dedup.summary_factual, dedup.published_at,
    dedup.source_name, dedup.source_slug, dedup.classification, dedup.match_reason
  from dedup
  order by dedup.published_at desc nulls last
  limit p_limit;
end;
$$;

comment on function rank_policies_for_user is
  'Returns policies scored for a user based on sector match, recency, jurisdiction, and lifecycle status.';
comment on function find_related_articles_for_policy is
  'Returns news articles plausibly about this policy via entity match or sector+classification overlap.';
