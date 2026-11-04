create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 120),
  website_url text check (website_url is null or website_url ~* '^https://'),
  created_at timestamptz not null default now()
);

create table public.cover_types (
  code text primary key,
  name text not null unique
);

insert into public.cover_types (code, name)
values
  ('life', 'Life cover'),
  ('tpd', 'Total and permanent disability (TPD)'),
  ('trauma', 'Trauma / critical illness'),
  ('income_protection', 'Income protection')
on conflict (code) do nothing;

create table public.artemis_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.source_records (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete restrict,
  source_url text not null check (source_url ~* '^https://'),
  title text not null check (length(trim(title)) between 1 and 240),
  captured_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  status text not null default 'draft' check (status in ('draft', 'verified', 'archived')),
  created_by uuid not null references auth.users (id) on delete restrict,
  verified_by uuid references auth.users (id) on delete restrict,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (
    (status = 'verified' and verified_by is not null and verified_at is not null)
    or (status <> 'verified' and verified_by is null and verified_at is null)
  )
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  summary text not null check (length(trim(summary)) between 1 and 1000),
  is_active boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (provider_id, name)
);

create table public.product_coverages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  cover_type text not null references public.cover_types (code) on delete restrict,
  summary text not null check (length(trim(summary)) between 1 and 2000),
  source_record_id uuid not null references public.source_records (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (product_id, cover_type, source_record_id)
);

create table public.product_facts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  cover_type text not null references public.cover_types (code) on delete restrict,
  fact_key text not null check (
    fact_key in (
      'eligibility',
      'exclusions',
      'waiting_period',
      'benefit_period',
      'premium_type',
      'indexation',
      'renewability',
      'claims_conditions',
      'other'
    )
  ),
  fact_value text not null check (length(trim(fact_value)) between 1 and 4000),
  source_record_id uuid not null references public.source_records (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.premium_examples (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  cover_type text not null references public.cover_types (code) on delete restrict,
  cover_amount numeric(14, 2) not null check (cover_amount > 0),
  age integer not null check (age between 18 and 100),
  state text not null check (state in ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA')),
  premium_basis text not null check (premium_basis in ('monthly', 'annual')),
  premium_amount numeric(12, 2) not null check (premium_amount >= 0),
  source_record_id uuid not null references public.source_records (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cover_type text not null references public.cover_types (code) on delete restrict,
  cover_amount numeric(14, 2) not null check (cover_amount > 0),
  age integer not null check (age between 18 and 100),
  state text not null check (state in ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA')),
  premium_basis text not null check (premium_basis in ('monthly', 'annual')),
  privacy_notice_version text not null,
  created_at timestamptz not null default now()
);

create table public.comparison_results (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  provider_name_snapshot text not null,
  product_name_snapshot text not null,
  product_summary_snapshot text not null,
  coverage_summary_snapshot text not null,
  coverage_source_snapshot jsonb not null,
  facts_snapshot jsonb not null default '[]'::jsonb,
  premium_amount_snapshot numeric(12, 2),
  premium_source_snapshot jsonb,
  created_at timestamptz not null default now(),
  unique (comparison_id, product_name_snapshot, provider_name_snapshot)
);

create index source_records_provider_status_idx
  on public.source_records (provider_id, status, effective_from desc);
create index products_provider_active_idx
  on public.products (provider_id, is_active);
create index product_coverages_product_type_idx
  on public.product_coverages (product_id, cover_type);
create index product_facts_product_type_idx
  on public.product_facts (product_id, cover_type);
create index premium_examples_match_idx
  on public.premium_examples (cover_type, cover_amount, age, state, premium_basis);
create index comparisons_user_created_idx
  on public.comparisons (user_id, created_at desc);
create index comparison_results_comparison_idx
  on public.comparison_results (comparison_id);

create function public.is_artemis_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.artemis_admins
    where user_id = (select auth.uid())
  );
$$;

create function public.is_provider_visible(p_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    join public.product_coverages pc on pc.product_id = p.id
    join public.source_records sr on sr.id = pc.source_record_id
    where p.provider_id = p_provider_id
      and p.is_active
      and sr.status = 'verified'
      and (sr.effective_from is null or sr.effective_from <= current_date)
      and (sr.effective_to is null or sr.effective_to >= current_date)
  );
$$;

create function public.is_product_visible(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    join public.product_coverages pc on pc.product_id = p.id
    join public.source_records sr on sr.id = pc.source_record_id
    where p.id = p_product_id
      and p.is_active
      and sr.status = 'verified'
      and (sr.effective_from is null or sr.effective_from <= current_date)
      and (sr.effective_to is null or sr.effective_to >= current_date)
  );
$$;

create function public.is_source_visible(p_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.source_records sr
    where sr.id = p_source_id
      and sr.status = 'verified'
      and (sr.effective_from is null or sr.effective_from <= current_date)
      and (sr.effective_to is null or sr.effective_to >= current_date)
  );
$$;

revoke all on function public.is_artemis_admin() from public, anon;
revoke all on function public.is_provider_visible(uuid) from public, anon;
revoke all on function public.is_product_visible(uuid) from public, anon;
revoke all on function public.is_source_visible(uuid) from public, anon;
grant execute on function public.is_artemis_admin() to authenticated;
grant execute on function public.is_provider_visible(uuid) to authenticated;
grant execute on function public.is_product_visible(uuid) to authenticated;
grant execute on function public.is_source_visible(uuid) to authenticated;

alter table public.providers enable row level security;
alter table public.cover_types enable row level security;
alter table public.artemis_admins enable row level security;
alter table public.source_records enable row level security;
alter table public.products enable row level security;
alter table public.product_coverages enable row level security;
alter table public.product_facts enable row level security;
alter table public.premium_examples enable row level security;
alter table public.comparisons enable row level security;
alter table public.comparison_results enable row level security;

revoke all on
  public.providers,
  public.cover_types,
  public.artemis_admins,
  public.source_records,
  public.products,
  public.product_coverages,
  public.product_facts,
  public.premium_examples,
  public.comparisons,
  public.comparison_results
from anon, authenticated;

grant select on
  public.providers,
  public.cover_types,
  public.source_records,
  public.products,
  public.product_coverages,
  public.product_facts,
  public.premium_examples,
  public.comparisons,
  public.comparison_results
to authenticated;
grant delete on public.comparisons to authenticated;

create policy "Signed-in users can read cover types"
on public.cover_types for select to authenticated
using (true);

create policy "Signed-in users can read providers with visible products"
on public.providers for select to authenticated
using (
  (select public.is_artemis_admin())
  or (select public.is_provider_visible(id))
);

create policy "Users can read verified sources"
on public.source_records for select to authenticated
using (
  (select public.is_source_visible(id))
  or (select public.is_artemis_admin())
);

create policy "Users can read active products"
on public.products for select to authenticated
using (
  (select public.is_product_visible(id))
  or (select public.is_artemis_admin())
);

create policy "Users can read verified product coverages"
on public.product_coverages for select to authenticated
using (
  (
    (select public.is_product_visible(product_id))
    and (select public.is_source_visible(source_record_id))
  )
  or (select public.is_artemis_admin())
);

create policy "Users can read verified product facts"
on public.product_facts for select to authenticated
using (
  (
    (select public.is_product_visible(product_id))
    and (select public.is_source_visible(source_record_id))
  )
  or (select public.is_artemis_admin())
);

create policy "Users can read verified premium examples"
on public.premium_examples for select to authenticated
using (
  (
    (select public.is_product_visible(product_id))
    and (select public.is_source_visible(source_record_id))
  )
  or (select public.is_artemis_admin())
);

create policy "Users can read only their comparisons"
on public.comparisons for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can delete only their comparisons"
on public.comparisons for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Users can read results of their comparisons"
on public.comparison_results for select to authenticated
using (
  exists (
    select 1
    from public.comparisons c
    where c.id = comparison_results.comparison_id
      and c.user_id = (select auth.uid())
  )
);

create function public.admin_create_catalog_entry(
  p_provider_name text,
  p_provider_website_url text,
  p_product_name text,
  p_product_summary text,
  p_cover_type text,
  p_coverage_summary text,
  p_source_url text,
  p_source_title text,
  p_effective_from date,
  p_effective_to date,
  p_facts jsonb,
  p_premium jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_provider_id uuid;
  v_product_id uuid;
  v_source_id uuid;
  v_fact jsonb;
begin
  if v_user_id is null or not public.is_artemis_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_source_url !~* '^https://'
    or jsonb_typeof(p_facts) <> 'array'
    or (p_premium is not null and jsonb_typeof(p_premium) <> 'object')
    or length(trim(p_provider_name)) not between 1 and 120
    or length(trim(p_product_name)) not between 1 and 160
    or length(trim(p_product_summary)) not between 1 and 1000
    or length(trim(p_coverage_summary)) not between 1 and 2000
    or length(trim(p_source_title)) not between 1 and 240
  then
    raise exception 'Invalid catalog entry' using errcode = '22023';
  end if;

  insert into public.providers (name, website_url)
  values (trim(p_provider_name), p_provider_website_url)
  on conflict (name) do update
    set website_url = coalesce(excluded.website_url, public.providers.website_url)
  returning id into v_provider_id;

  insert into public.source_records (
    provider_id, source_url, title, effective_from, effective_to, created_by
  )
  values (
    v_provider_id, p_source_url, trim(p_source_title), p_effective_from,
    p_effective_to, v_user_id
  )
  returning id into v_source_id;

  insert into public.products (provider_id, name, summary, created_by)
  values (v_provider_id, trim(p_product_name), trim(p_product_summary), v_user_id)
  on conflict (provider_id, name) do update
    set summary = excluded.summary
  returning id into v_product_id;

  insert into public.product_coverages (
    product_id, cover_type, summary, source_record_id
  )
  values (v_product_id, p_cover_type, trim(p_coverage_summary), v_source_id);

  for v_fact in select value from jsonb_array_elements(p_facts)
  loop
    if jsonb_typeof(v_fact) <> 'object'
      or v_fact->>'key' not in (
        'eligibility', 'exclusions', 'waiting_period', 'benefit_period',
        'premium_type', 'indexation', 'renewability', 'claims_conditions', 'other'
      )
      or length(trim(coalesce(v_fact->>'value', ''))) not between 1 and 4000
    then
      raise exception 'Invalid product fact' using errcode = '22023';
    end if;

    insert into public.product_facts (
      product_id, cover_type, fact_key, fact_value, source_record_id
    )
    values (
      v_product_id, p_cover_type, v_fact->>'key', trim(v_fact->>'value'), v_source_id
    );
  end loop;

  if p_premium is not null then
    if coalesce((p_premium->>'cover_amount')::numeric, 0) <= 0
      or (p_premium->>'age')::integer not between 18 and 100
      or p_premium->>'state' not in ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA')
      or p_premium->>'premium_basis' not in ('monthly', 'annual')
      or coalesce((p_premium->>'premium_amount')::numeric, -1) < 0
    then
      raise exception 'Invalid sourced premium assumptions' using errcode = '22023';
    end if;

    insert into public.premium_examples (
      product_id, cover_type, cover_amount, age, state, premium_basis,
      premium_amount, source_record_id
    )
    values (
      v_product_id,
      p_cover_type,
      (p_premium->>'cover_amount')::numeric,
      (p_premium->>'age')::integer,
      p_premium->>'state',
      p_premium->>'premium_basis',
      (p_premium->>'premium_amount')::numeric,
      v_source_id
    );
  end if;

  return v_source_id;
end;
$$;

create function public.admin_verify_source(p_source_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_artemis_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  update public.source_records
  set status = 'verified',
      verified_by = auth.uid(),
      verified_at = now()
  where id = p_source_id
    and status = 'draft';

  if not found then
    raise exception 'Draft source not found' using errcode = 'P0002';
  end if;

  update public.products p
  set is_active = true
  where exists (
    select 1
    from public.product_coverages pc
    where pc.product_id = p.id
      and pc.source_record_id = p_source_id
  );
end;
$$;

create function public.save_comparison(
  p_cover_type text,
  p_cover_amount numeric,
  p_age integer,
  p_state text,
  p_premium_basis text,
  p_privacy_notice_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_comparison_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_cover_type not in ('life', 'tpd', 'trauma', 'income_protection')
    or p_cover_amount is null
    or p_cover_amount <= 0
    or p_cover_amount > 100000000
    or p_age not between 18 and 100
    or p_state not in ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA')
    or p_premium_basis not in ('monthly', 'annual')
    or p_privacy_notice_version <> 'comparison-v1'
  then
    raise exception 'Invalid comparison assumptions' using errcode = '22023';
  end if;

  insert into public.comparisons (
    user_id, cover_type, cover_amount, age, state, premium_basis,
    privacy_notice_version
  )
  values (
    v_user_id, p_cover_type, p_cover_amount, p_age, p_state, p_premium_basis,
    p_privacy_notice_version
  )
  returning id into v_comparison_id;

  with selected_coverages as (
    select distinct on (pc.product_id)
      pc.product_id,
      pc.cover_type,
      pc.summary,
      pc.source_record_id
    from public.product_coverages pc
    join public.source_records sr on sr.id = pc.source_record_id
    join public.products p on p.id = pc.product_id
    where pc.cover_type = p_cover_type
      and p.is_active
      and sr.status = 'verified'
      and (sr.effective_from is null or sr.effective_from <= current_date)
      and (sr.effective_to is null or sr.effective_to >= current_date)
    order by pc.product_id, sr.effective_from desc nulls last, sr.captured_at desc
  )
  insert into public.comparison_results (
    comparison_id,
    product_id,
    provider_name_snapshot,
    product_name_snapshot,
    product_summary_snapshot,
    coverage_summary_snapshot,
    coverage_source_snapshot,
    facts_snapshot,
    premium_amount_snapshot,
    premium_source_snapshot
  )
  select
    v_comparison_id,
    p.id,
    provider.name,
    p.name,
    p.summary,
    coverage.summary,
    jsonb_build_object(
      'title', coverage_source.title,
      'url', coverage_source.source_url,
      'capturedAt', coverage_source.captured_at,
      'effectiveFrom', coverage_source.effective_from,
      'effectiveTo', coverage_source.effective_to
    ),
    coalesce(facts.items, '[]'::jsonb),
    premium.premium_amount,
    premium.source_snapshot
  from selected_coverages coverage
  join public.products p on p.id = coverage.product_id
  join public.providers provider on provider.id = p.provider_id
  join public.source_records coverage_source on coverage_source.id = coverage.source_record_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'key', fact.fact_key,
        'value', fact.fact_value,
        'source', jsonb_build_object(
          'title', source.title,
          'url', source.source_url,
          'capturedAt', source.captured_at,
          'effectiveFrom', source.effective_from,
          'effectiveTo', source.effective_to
        )
      )
      order by fact.fact_key
    ) as items
    from (
      select distinct on (pf.fact_key)
        pf.fact_key, pf.fact_value, pf.source_record_id
      from public.product_facts pf
      join public.source_records fact_source on fact_source.id = pf.source_record_id
      where pf.product_id = p.id
        and pf.cover_type = p_cover_type
        and fact_source.status = 'verified'
        and (fact_source.effective_from is null or fact_source.effective_from <= current_date)
        and (fact_source.effective_to is null or fact_source.effective_to >= current_date)
      order by pf.fact_key, fact_source.effective_from desc nulls last, fact_source.captured_at desc
    ) fact
    join public.source_records source on source.id = fact.source_record_id
  ) facts on true
  left join lateral (
    select
      example.premium_amount,
      jsonb_build_object(
        'title', source.title,
        'url', source.source_url,
        'capturedAt', source.captured_at,
        'effectiveFrom', source.effective_from,
        'effectiveTo', source.effective_to
      ) as source_snapshot
    from public.premium_examples example
    join public.source_records source on source.id = example.source_record_id
    where example.product_id = p.id
      and example.cover_type = p_cover_type
      and example.cover_amount = p_cover_amount
      and example.age = p_age
      and example.state = p_state
      and example.premium_basis = p_premium_basis
      and source.status = 'verified'
      and (source.effective_from is null or source.effective_from <= current_date)
      and (source.effective_to is null or source.effective_to >= current_date)
    order by source.effective_from desc nulls last, source.captured_at desc
    limit 1
  ) premium on true;

  return v_comparison_id;
end;
$$;

revoke all on function public.admin_create_catalog_entry(
  text, text, text, text, text, text, text, text, date, date, jsonb, jsonb
) from public, anon;
revoke all on function public.admin_verify_source(uuid) from public, anon;
revoke all on function public.save_comparison(text, numeric, integer, text, text, text)
  from public, anon;
grant execute on function public.admin_create_catalog_entry(
  text, text, text, text, text, text, text, text, date, date, jsonb, jsonb
) to authenticated;
grant execute on function public.admin_verify_source(uuid) to authenticated;
grant execute on function public.save_comparison(text, numeric, integer, text, text, text)
  to authenticated;

insert into public.providers (name)
values ('Medibank'), ('AHM'), ('TAL')
on conflict (name) do nothing;
