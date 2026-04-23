-- ============================================================================
-- Phase 4A: Policy Tracker — ingestion schema
--
-- The `policies` table already exists from Phase 1. This migration adds the
-- columns we need for:
--   - Deduplication (external_id across agency + docket)
--   - State tracking (history of status transitions)
--   - Provenance (which source, when fetched, raw payload for debugging)
--   - Enrichment state (same pending/in_progress/done pattern as articles)
--   - AI-generated fields (what this means for investors)
-- ============================================================================

-- Dedup + provenance
alter table policies
  add column if not exists external_id          text,
  add column if not exists external_source      text,
  add column if not exists docket_id            text,
  add column if not exists document_type        text,
  add column if not exists raw_payload          jsonb,
  add column if not exists fetched_at           timestamptz,
  add column if not exists published_at         timestamptz;

-- Enrichment state machine, same pattern as news_articles
alter table policies
  add column if not exists enrichment_status    text default 'pending'
    check (enrichment_status in ('pending', 'in_progress', 'done', 'failed', 'skipped')),
  add column if not exists enrichment_error     text,
  add column if not exists enrichment_attempts  int default 0;

-- AI-generated investor-facing fields (Sonnet output)
alter table policies
  add column if not exists investor_implications text,
  add column if not exists affected_company_types text[];

-- Link back to news articles that covered this policy
alter table policies
  add column if not exists related_article_ids  bigint[];

-- external_id must be unique per source to allow upserts
create unique index if not exists idx_policies_external_unique
  on policies (external_source, external_id)
  where external_id is not null;

create index if not exists idx_policies_published on policies (published_at desc nulls last);
create index if not exists idx_policies_enrichment_pending
  on policies (enrichment_status, fetched_at)
  where enrichment_status = 'pending';
create index if not exists idx_policies_document_type on policies (document_type);

-- ============================================================================
-- policy_status_history
-- Track transitions. When a policy moves from 'proposed' -> 'comment_period' ->
-- 'enacted', we write a row here. Investors care about the trajectory,
-- not just the current state.
-- ============================================================================
create table if not exists policy_status_history (
  id              bigserial primary key,
  policy_id       bigint not null references policies(id) on delete cascade,
  from_status     text,
  to_status       text not null,
  changed_at      timestamptz default now(),
  source_event    text,  -- e.g. 'ingestion_update', 'manual_correction'
  notes           text
);

create index idx_policy_history_policy on policy_status_history (policy_id, changed_at desc);

-- ============================================================================
-- RLS — defense in depth, all access via service role in API routes
-- ============================================================================
alter table policy_status_history enable row level security;

-- Update trigger (reuse the function from Phase 1 news schema)
create or replace function update_policy_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_policies_last_updated on policies;
create trigger trg_policies_last_updated
  before update on policies
  for each row execute function update_policy_timestamp();
