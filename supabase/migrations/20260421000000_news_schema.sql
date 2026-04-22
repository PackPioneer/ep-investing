-- ============================================================================
-- EP Investing: News & Intelligence System
-- Phase 1: Ingestion, storage, and public /news page
--
-- This migration creates the full schema including columns that aren't
-- populated until later phases (embeddings, summaries, entity extraction).
-- Columns are nullable so Phase 1 ingestion works; later phases fill them in.
-- ============================================================================

-- pgvector for embeddings (populated in Phase 2 onward)
create extension if not exists vector;

-- ============================================================================
-- news_sources
-- Registry of feeds/APIs we ingest from. Seeded separately via
-- scripts/seed-news-sources.js.
-- ============================================================================
create table if not exists news_sources (
  id                    bigserial primary key,
  name                  text not null,
  slug                  text unique not null,
  feed_url              text not null,
  feed_type             text not null check (feed_type in ('rss', 'api', 'scrape')),
  homepage_url          text,
  region                text,
  category              text check (category in (
                          'climate_publication',
                          'press_release',
                          'policy',
                          'analysis',
                          'primary_journalism'
                        )),
  language              text default 'en',
  credibility_tier      int not null default 2 check (credibility_tier between 1 and 3),
  is_secondary_source   boolean default false,
  attribution_label     text,
  -- ingestion state
  active                boolean default true,
  last_fetched_at       timestamptz,
  last_success_at       timestamptz,
  last_error            text,
  consecutive_failures  int default 0,
  fetch_interval_hours  int default 1,
  -- metadata
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_news_sources_active on news_sources (active) where active = true;
create index idx_news_sources_region on news_sources (region);

comment on column news_sources.credibility_tier is
  '1 = primary/high-trust, 2 = reputable secondary, 3 = watch-listed/low-confidence';
comment on column news_sources.attribution_label is
  'Shown in UI for partner/affiliated sources, e.g. "EP Investing partner publication"';

-- ============================================================================
-- news_articles
-- Raw articles ingested from sources. Enrichment fields populated in Phase 2.
-- ============================================================================
create table if not exists news_articles (
  id                         bigserial primary key,
  source_id                  bigint not null references news_sources(id) on delete cascade,

  -- core content
  url                        text not null,
  url_hash                   text not null,
  title                      text not null,
  author                     text,
  published_at               timestamptz,
  fetched_at                 timestamptz default now(),

  -- content
  raw_content                text,
  clean_content              text,
  excerpt                    text,
  image_url                  text,

  -- enrichment (Phase 2+)
  summary_factual            text,
  summary_analytical         text,
  classification             text check (classification in (
                               'funding', 'policy', 'm_and_a', 'product',
                               'regulatory', 'market', 'partnership', 'other'
                             ) or classification is null),
  geography_tags             text[],
  sector_tags                text[],
  deal_size_usd              bigint,
  embedding                  vector(1536),

  -- provenance / quality
  quality_score              float default 0.5,
  is_secondary_source        boolean default false,
  primary_source_attribution text,

  -- ingestion/enrichment state machine
  enrichment_status          text default 'pending' check (enrichment_status in (
                               'pending', 'in_progress', 'done', 'failed', 'skipped'
                             )),
  enrichment_error           text,
  enrichment_attempts        int default 0,

  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now(),

  -- dedup: normalized URL hash must be unique
  constraint news_articles_url_hash_unique unique (url_hash)
);

create index idx_news_articles_source on news_articles (source_id);
create index idx_news_articles_published on news_articles (published_at desc nulls last);
create index idx_news_articles_classification on news_articles (classification);
create index idx_news_articles_enrichment_pending
  on news_articles (enrichment_status, fetched_at)
  where enrichment_status = 'pending';
create index idx_news_articles_geography on news_articles using gin (geography_tags);
create index idx_news_articles_sectors on news_articles using gin (sector_tags);

-- Vector index for semantic search (Phase 2+). ivfflat is cheap to build;
-- switch to hnsw later if recall matters more than build time.
create index idx_news_articles_embedding
  on news_articles using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================================
-- news_entities
-- Entities (companies, people, policies, agencies) mentioned in articles.
-- Populated by enrichment pipeline in Phase 2. entity_id_ref links to the
-- canonical record in companies/policies where we can resolve it.
-- ============================================================================
create table if not exists news_entities (
  id               bigserial primary key,
  article_id       bigint not null references news_articles(id) on delete cascade,
  entity_type      text not null check (entity_type in (
                     'company', 'person', 'policy', 'agency', 'fund'
                   )),
  entity_name      text not null,
  entity_id_ref    bigint,
  confidence       float default 1.0 check (confidence between 0 and 1),
  created_at       timestamptz default now()
);

create index idx_news_entities_article on news_entities (article_id);
create index idx_news_entities_lookup on news_entities (entity_type, entity_name);
create index idx_news_entities_ref on news_entities (entity_id_ref)
  where entity_id_ref is not null;

-- ============================================================================
-- policies
-- Tracked regulatory/legislative items. Populated in Phase 4.
-- ============================================================================
create table if not exists policies (
  id                      bigserial primary key,
  jurisdiction            text not null,
  agency                  text,
  title                   text not null,
  status                  text check (status in (
                            'proposed', 'comment_period', 'enacted',
                            'implemented', 'expired', 'withdrawn'
                          )),
  effective_date          date,
  comment_deadline        date,
  sectors                 text[],
  plain_english_summary   text,
  what_changed            text,
  who_affected            text,
  source_url              text,
  is_secondary_source     boolean default false,
  primary_attribution     text,
  embedding               vector(1536),
  last_updated_at         timestamptz default now(),
  created_at              timestamptz default now()
);

create index idx_policies_jurisdiction on policies (jurisdiction);
create index idx_policies_status on policies (status);
create index idx_policies_sectors on policies using gin (sectors);
create index idx_policies_effective_date on policies (effective_date desc nulls last);

-- ============================================================================
-- user_news_preferences
-- Per-user personalization settings. Populated in Phase 3.
-- Uses clerk_user_id to match the existing auth pattern.
-- ============================================================================
create table if not exists user_news_preferences (
  id                    bigserial primary key,
  clerk_user_id         text unique not null,
  user_type             text check (user_type in (
                          'investor', 'company', 'expert', 'researcher'
                        )),
  sectors               text[] default '{}',
  geographies           text[] default '{}',
  investor_emphasis     text default 'balanced' check (investor_emphasis in (
                          'portfolio', 'dealflow', 'thesis', 'balanced'
                        )),
  digest_frequency      text default 'weekly' check (digest_frequency in (
                          'daily', 'weekly', 'off'
                        )),
  digest_day            int default 1 check (digest_day between 0 and 6),
  muted_sources         bigint[] default '{}',
  muted_topics          text[] default '{}',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_user_news_prefs_clerk on user_news_preferences (clerk_user_id);

-- ============================================================================
-- user_news_interactions
-- Implicit + explicit feedback signals used for personalization ranking.
-- ============================================================================
create table if not exists user_news_interactions (
  id               bigserial primary key,
  clerk_user_id    text not null,
  article_id       bigint not null references news_articles(id) on delete cascade,
  action           text not null check (action in (
                     'view', 'save', 'dismiss', 'thumb_up', 'thumb_down', 'click_out'
                   )),
  created_at       timestamptz default now()
);

create index idx_user_interactions_user on user_news_interactions (clerk_user_id);
create index idx_user_interactions_article on user_news_interactions (article_id);
create index idx_user_interactions_user_action on user_news_interactions (clerk_user_id, action);

-- ============================================================================
-- news_ingestion_runs
-- Audit trail for every cron execution. Essential for debugging silent
-- failures; you WILL need this the first time a feed breaks in prod.
-- ============================================================================
create table if not exists news_ingestion_runs (
  id                         bigserial primary key,
  started_at                 timestamptz default now(),
  completed_at               timestamptz,
  sources_attempted          int default 0,
  sources_succeeded          int default 0,
  articles_inserted          int default 0,
  articles_skipped_duplicate int default 0,
  errors                     jsonb default '[]'::jsonb,
  status                     text default 'running' check (status in (
                               'running', 'completed', 'failed'
                             ))
);

create index idx_ingestion_runs_started on news_ingestion_runs (started_at desc);

-- ============================================================================
-- Row Level Security
--
-- Pattern matches existing EP Investing setup: RLS enabled as defense-in-depth,
-- but all real access goes through API routes using the service role key,
-- which bypasses RLS. API routes do the actual auth/subscription checks.
--
-- No permissive policies here means direct client queries (anon or
-- authenticated) return nothing. This is intentional.
-- ============================================================================
alter table news_sources            enable row level security;
alter table news_articles           enable row level security;
alter table news_entities           enable row level security;
alter table policies                enable row level security;
alter table user_news_preferences   enable row level security;
alter table user_news_interactions  enable row level security;
alter table news_ingestion_runs     enable row level security;

-- ============================================================================
-- updated_at trigger
-- ============================================================================
create or replace function news_update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_news_sources_updated_at
  before update on news_sources
  for each row execute function news_update_updated_at();

create trigger trg_news_articles_updated_at
  before update on news_articles
  for each row execute function news_update_updated_at();

create trigger trg_user_news_preferences_updated_at
  before update on user_news_preferences
  for each row execute function news_update_updated_at();
