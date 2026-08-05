-- funding_events — structured capital + commercial events for the markets tracker.
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Sources blend into one table, tagged by provenance; the wire reads from here.

create table if not exists funding_events (
  id                bigint generated always as identity primary key,

  -- provenance: how we learned about this event
  source            text not null default 'news',        -- news | self_reported | sec_form_d
  source_article_id bigint references news_articles(id) on delete set null,
  verified          boolean not null default false,      -- true = firsthand, announced on EP
  extractor_version text,

  -- classification
  category          text not null,                       -- capital | commercial | context
  type              text not null,                       -- venture_equity | corporate_strategic |
                                                          -- project_finance | debt | grant |
                                                          -- fund_raise | m_and_a | ipo_spac |
                                                          -- offtake | ppa | market_stat

  -- who
  company_id        bigint references companies(id) on delete set null,  -- resolved match, if any
  company_name      text,                                -- raw extracted name
  counterparty      text,                                -- lead investor(s) or buyer
  investors         text[] default '{}',

  -- how much (capital)
  amount_usd        bigint,
  currency_original text,
  stage             text,
  instrument        text,

  -- how much (commercial: offtake / ppa)
  commercial_volume numeric,
  commercial_unit   text,                                -- MW | GWh | MWh | tons | units
  duration_years    numeric,

  -- when / where / how sure
  geography         text,
  announced_date    date,
  confidence        text,                                -- high | medium | low
  evidence          text,

  -- housekeeping
  dedup_key         text,                                -- normalized company|amount|month
  is_hidden         boolean not null default false,      -- low-confidence held from public wire
  created_at        timestamptz not null default now()
);

create index if not exists funding_events_announced_idx on funding_events (announced_date desc);
create index if not exists funding_events_type_idx       on funding_events (type);
create index if not exists funding_events_category_idx   on funding_events (category);
create index if not exists funding_events_company_idx    on funding_events (company_id);
create index if not exists funding_events_dedup_idx      on funding_events (dedup_key);
create index if not exists funding_events_source_idx     on funding_events (source);
