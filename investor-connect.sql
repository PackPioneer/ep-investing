-- Quick-facts columns for investor profiles (safe if they already exist).
alter table vc_firms add column if not exists fund_size text;
alter table vc_firms add column if not exists sweet_spot_check_size text;
alter table vc_firms add column if not exists total_aum text;
alter table vc_firms add column if not exists location text;
alter table vc_firms add column if not exists founded_year text;

-- "Request to connect": a registered company asks to be shown to an investor.
create table if not exists investor_connections (
  id            bigserial primary key,
  investor_id   bigint not null,      -- vc_firms.id
  company_id    bigint not null,      -- companies.id (the requester's company)
  clerk_user_id text,                 -- who submitted it
  note          text,
  status        text default 'pending',
  created_at    timestamptz default now(),
  unique (investor_id, company_id)
);
create index if not exists idx_inv_conn_investor on investor_connections (investor_id);
create index if not exists idx_inv_conn_company  on investor_connections (company_id);
