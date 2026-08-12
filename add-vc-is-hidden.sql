-- Soft-hide support for investors (mirrors companies.is_hidden).
alter table vc_firms add column if not exists is_hidden boolean default false;
create index if not exists idx_vc_firms_is_hidden on vc_firms (is_hidden);
