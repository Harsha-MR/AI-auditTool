create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  company text,
  name text,
  role text,
  team_size integer,
  baseline_spend_usd numeric not null default 0,
  savings_usd numeric not null default 0,
  primary_use_case text not null,
  region text,
  public_audit_id text
);

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  public_id text not null unique,
  public_payload jsonb not null,
  baseline_spend_usd numeric not null default 0,
  savings_usd numeric not null default 0
);

create index if not exists audits_public_id_idx on public.audits (public_id);
