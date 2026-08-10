-- Lightweight site-wide feedback capture (footer "Feedback" link).
-- Run once in the Supabase SQL editor.

create table if not exists feedback (
  id         bigint generated always as identity primary key,
  category   text,
  details    text not null,
  email      text,
  page       text,
  created_at timestamptz not null default now()
);
