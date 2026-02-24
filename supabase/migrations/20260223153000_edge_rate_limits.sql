-- Edge Functions rate limiting (simple fixed window)
-- Uses a server-side table so Edge Functions can enforce limits per user/ip.

create table if not exists public.edge_rate_limits (
  identifier text not null,
  rl_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (identifier, rl_key, window_start)
);

create index if not exists edge_rate_limits_key_window_idx
  on public.edge_rate_limits (rl_key, window_start);

alter table public.edge_rate_limits enable row level security;

-- No direct access from clients.
revoke all on table public.edge_rate_limits from anon, authenticated;
