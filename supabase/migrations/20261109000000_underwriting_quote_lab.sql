-- Test-only underwriting profile and quote result model.
-- Underwriting payloads are AES-256-GCM encrypted in the application before
-- they reach Postgres. Do not remove that layer for real data.

create table public.quote_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  schema_version integer not null default 1 check (schema_version > 0),
  payload_ciphertext text not null,
  payload_iv text not null check (length(payload_iv) = 16),
  payload_tag text not null check (length(payload_tag) = 24),
  encryption_key_version text not null,
  consent_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider_name text not null check (length(trim(provider_name)) between 1 and 120),
  product_name text not null check (length(trim(product_name)) between 1 and 160),
  cover_type text not null references public.cover_types (code) on delete restrict,
  cover_amount numeric(14, 2) not null check (cover_amount > 0),
  premium_basis text not null check (premium_basis in ('monthly', 'annual')),
  request_status text not null default 'draft'
    check (request_status in ('draft', 'ready', 'submitted', 'blocked', 'failed')),
  request_payload_ciphertext text not null,
  request_payload_iv text not null check (length(request_payload_iv) = 16),
  request_payload_tag text not null check (length(request_payload_tag) = 24),
  encryption_key_version text not null,
  store_consent_version text not null,
  send_consent_version text,
  send_consented_at timestamptz,
  submitted_at timestamptz,
  provider_reference text,
  status_note text check (status_note is null or length(status_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (send_consent_version is null and send_consented_at is null)
    or (send_consent_version is not null and send_consented_at is not null)
  ),
  check (request_status <> 'submitted' or submitted_at is not null)
);

create table public.quote_results (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  result_kind text not null check (result_kind in ('provider_quote', 'simulated_test')),
  provider_reference text,
  premium_amount numeric(12, 2) check (premium_amount is null or premium_amount >= 0),
  currency char(3) not null default 'AUD' check (currency = 'AUD'),
  premium_basis text not null check (premium_basis in ('monthly', 'annual')),
  retrieved_at timestamptz not null default now(),
  expires_at timestamptz,
  source_url text check (source_url is null or source_url ~* '^https://'),
  result_payload_ciphertext text,
  result_payload_iv text,
  result_payload_tag text,
  encryption_key_version text,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at >= retrieved_at),
  check (
    (result_payload_ciphertext is null and result_payload_iv is null
      and result_payload_tag is null and encryption_key_version is null)
    or
    (result_payload_ciphertext is not null and result_payload_iv is not null
      and length(result_payload_iv) = 16
      and result_payload_tag is not null and length(result_payload_tag) = 24
      and encryption_key_version is not null)
  ),
  check (result_kind <> 'simulated_test' or provider_reference is null)
);

create index quote_requests_user_created_idx
  on public.quote_requests (user_id, created_at desc);
create index quote_results_request_created_idx
  on public.quote_results (quote_request_id, created_at desc);

alter table public.quote_profiles enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_results enable row level security;

revoke all on public.quote_profiles, public.quote_requests, public.quote_results
from anon, authenticated;

grant select, insert, update, delete on public.quote_profiles to authenticated;
grant select, insert, delete on public.quote_requests to authenticated;
grant select, insert, delete on public.quote_results to authenticated;

create policy "Users can manage their own encrypted quote profile"
on public.quote_profiles for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can read their own quote requests"
on public.quote_requests for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create draft quote requests"
on public.quote_requests for insert to authenticated
with check (
  user_id = (select auth.uid())
  and request_status = 'draft'
  and send_consent_version is null
  and submitted_at is null
);

create policy "Users can delete their own quote requests"
on public.quote_requests for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Users can read results for their own quote requests"
on public.quote_results for select to authenticated
using (
  exists (
    select 1 from public.quote_requests qr
    where qr.id = quote_results.quote_request_id
      and qr.user_id = (select auth.uid())
  ) and result_kind = 'simulated_test'
);

create policy "Users can add results to their own quote requests"
on public.quote_results for insert to authenticated
with check (
  exists (
    select 1 from public.quote_requests qr
    where qr.id = quote_results.quote_request_id
      and qr.user_id = (select auth.uid())
  )
  and result_kind = 'simulated_test'
);

create policy "Users can delete results for their own quote requests"
on public.quote_results for delete to authenticated
using (
  exists (
    select 1 from public.quote_requests qr
    where qr.id = quote_results.quote_request_id
      and qr.user_id = (select auth.uid())
  )
);
