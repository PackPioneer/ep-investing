-- Soft-hide support for NGOs (mirrors companies.is_hidden / vc_firms.is_hidden).
-- Avoids overloading the status column, which is constrained to active/pending/rejected.
alter table ngos add column if not exists is_hidden boolean default false;
create index if not exists idx_ngos_is_hidden on ngos (is_hidden);
