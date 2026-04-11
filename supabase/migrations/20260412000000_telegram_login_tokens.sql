create table if not exists telegram_login_tokens (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'pending', -- pending | claimed | expired
  telegram_id bigint,
  user_id uuid references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  needs_onboarding boolean not null default false,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

alter table telegram_login_tokens enable row level security;

-- Only service role can read/write
create policy "service role only" on telegram_login_tokens
  using (false);

-- Auto-expire old tokens (cleanup)
create index if not exists telegram_login_tokens_expires_at_idx on telegram_login_tokens(expires_at);
