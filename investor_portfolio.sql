-- Many-to-many link between investors (vc_firms) and their portfolio companies.
-- Both sides already exist as directory records; this table connects them so a
-- VC profile can list its portfolio and a company profile can list its backers.
-- No FK constraints (avoids id-type mismatches across environments); uniqueness
-- prevents duplicate links.

create table if not exists investor_portfolio (
  id           bigserial primary key,
  investor_id  bigint not null,
  company_id   bigint not null,
  source       text,                         -- e.g. 'scraped:portfolio', 'admin'
  created_at   timestamptz default now(),
  unique (investor_id, company_id)
);

create index if not exists idx_inv_portfolio_investor on investor_portfolio (investor_id);
create index if not exists idx_inv_portfolio_company  on investor_portfolio (company_id);
