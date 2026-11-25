-- OAuth credentials are encrypted by the app with AES-256-GCM before they
-- reach Postgres. Activity records are fetched on demand and are not stored.
create table public.cycling_strava_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  athlete_id text not null unique,
  token_ciphertext text not null,
  token_iv text not null check (length(token_iv) = 16),
  token_tag text not null check (length(token_tag) = 24),
  granted_scope text not null,
  token_expires_at timestamptz not null,
  consent_version text not null,
  consented_at timestamptz not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cycling_strava_webhook_config (
  singleton boolean primary key default true check (singleton),
  webhook_secret_hash text not null check (length(webhook_secret_hash) = 32)
);

alter table public.cycling_strava_connections enable row level security;
alter table public.cycling_strava_webhook_config enable row level security;
revoke all on public.cycling_strava_connections from public, anon, authenticated;
revoke all on public.cycling_strava_webhook_config from public, anon, authenticated;

create function public.get_cycling_strava_connection()
returns table (
  athlete_id text,
  token_ciphertext text,
  token_iv text,
  token_tag text,
  granted_scope text,
  token_expires_at timestamptz,
  consent_version text,
  consented_at timestamptz
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select c.athlete_id, c.token_ciphertext, c.token_iv, c.token_tag,
         c.granted_scope, c.token_expires_at, c.consent_version, c.consented_at
  from public.cycling_strava_connections c
  where c.user_id = auth.uid()
$$;

create function public.upsert_cycling_strava_connection(
  p_athlete_id text,
  p_token_ciphertext text,
  p_token_iv text,
  p_token_tag text,
  p_granted_scope text,
  p_token_expires_at timestamptz,
  p_consent_version text,
  p_consented_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if length(p_athlete_id) not between 1 and 32
     or length(p_token_ciphertext) > 10000
     or length(p_token_iv) <> 16
     or length(p_token_tag) <> 24
     or length(p_granted_scope) > 500
     or p_consent_version <> 'cycling-strava-v1'
     or p_consented_at is null then
    raise exception 'Invalid Strava connection data';
  end if;

  insert into public.cycling_strava_connections (
    user_id, athlete_id, token_ciphertext, token_iv, token_tag,
    granted_scope, token_expires_at, consent_version, consented_at, updated_at
  ) values (
    auth.uid(), p_athlete_id, p_token_ciphertext, p_token_iv, p_token_tag,
    p_granted_scope, p_token_expires_at, p_consent_version, p_consented_at, now()
  )
  on conflict (user_id) do update set
    athlete_id = excluded.athlete_id,
    token_ciphertext = excluded.token_ciphertext,
    token_iv = excluded.token_iv,
    token_tag = excluded.token_tag,
    granted_scope = excluded.granted_scope,
    token_expires_at = excluded.token_expires_at,
    consent_version = excluded.consent_version,
    consented_at = excluded.consented_at,
    updated_at = now();
end;
$$;

create function public.delete_cycling_strava_connection()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.cycling_strava_connections where user_id = auth.uid();
end;
$$;

create function public.delete_cycling_strava_connection_from_webhook(
  p_athlete_id text,
  p_webhook_secret text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.cycling_strava_webhook_config
    where singleton and webhook_secret_hash = md5(p_webhook_secret)
  ) then
    raise exception 'Webhook authentication failed';
  end if;
  delete from public.cycling_strava_connections where athlete_id = p_athlete_id;
end;
$$;

create function public.check_cycling_strava_webhook_config(p_webhook_secret text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.cycling_strava_webhook_config
    where singleton and webhook_secret_hash = md5(p_webhook_secret)
  )
$$;

revoke all on function public.get_cycling_strava_connection() from public, anon;
revoke all on function public.upsert_cycling_strava_connection(text, text, text, text, text, timestamptz, text, timestamptz) from public, anon;
revoke all on function public.delete_cycling_strava_connection() from public, anon;
revoke all on function public.delete_cycling_strava_connection_from_webhook(text, text) from public, anon, authenticated;
revoke all on function public.check_cycling_strava_webhook_config(text) from public, anon;
grant execute on function public.get_cycling_strava_connection() to authenticated;
grant execute on function public.upsert_cycling_strava_connection(text, text, text, text, text, timestamptz, text, timestamptz) to authenticated;
grant execute on function public.delete_cycling_strava_connection() to authenticated;
grant execute on function public.delete_cycling_strava_connection_from_webhook(text, text) to anon;
grant execute on function public.check_cycling_strava_webhook_config(text) to authenticated;
