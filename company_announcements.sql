-- company_announcements — the announcements & partnerships revenue tool.
-- Run once in the Supabase SQL editor.

create table if not exists company_announcements (
  id            bigint generated always as identity primary key,
  company_id    bigint not null references companies(id) on delete cascade,

  -- what kind of announcement
  category      text not null check (category in (
                  'partnership', 'raise_open', 'raise_close', 'product', 'award',
                  'hire', 'milestone', 'expansion', 'other'
                )),
  title         text not null,
  body          text,
  link_url      text,

  -- category-specific structured fields live here (partner_name, amount_usd,
  -- round_type, lead_investor, close_date, product_name, award_name, grantor…)
  meta          jsonb not null default '{}',

  -- review workflow: companies submit -> pending; admin publishes or rejects
  status        text not null default 'pending' check (status in (
                  'pending', 'published', 'rejected'
                )),
  review_note   text,
  reviewed_by   text,
  reviewed_at   timestamptz,

  -- monetization hook (freemium): paid "boost" features an announcement.
  is_featured   boolean not null default false,
  featured_until timestamptz,

  -- flywheel: raise announcements auto-draft a tracker entry that admin confirms.
  tracker_event_id bigint references funding_events(id) on delete set null,

  created_by    text,                       -- clerk_user_id of submitter
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index if not exists announcements_company_idx  on company_announcements (company_id);
create index if not exists announcements_status_idx    on company_announcements (status);
create index if not exists announcements_category_idx  on company_announcements (category);
create index if not exists announcements_published_idx on company_announcements (published_at desc);
create index if not exists announcements_featured_idx  on company_announcements (is_featured) where is_featured = true;

-- "Seeking" declarations on the company profile (shown as CTAs).
-- seeking_partnerships already exists as a boolean; add NGO + investor asks + notes.
alter table companies add column if not exists seeking_ngo        boolean not null default false;
alter table companies add column if not exists seeking_investors  boolean not null default false;
alter table companies add column if not exists seeking_note       text;

-- If the table was already created with the original 5 categories, refresh the
-- constraint to include the new ones. Safe to run repeatedly.
alter table company_announcements drop constraint if exists company_announcements_category_check;
alter table company_announcements add constraint company_announcements_category_check
  check (category in ('partnership','raise_open','raise_close','product','award','hire','milestone','expansion','other'));
