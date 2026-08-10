-- Adds the is_curated flag to company_announcements so news-seeded newsroom
-- items can be distinguished from company-posted ones (and kept off profiles).
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table company_announcements add column if not exists is_curated boolean not null default false;
create index if not exists announcements_curated_idx on company_announcements (is_curated);

-- Admin-posted and news-seeded items have no company submitter (created_by is
-- null) — mark those curated so they get the newsroom "Read release" treatment.
update company_announcements set is_curated = true where created_by is null and is_curated = false;
