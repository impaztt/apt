create extension if not exists pgcrypto;

create table if not exists public.apartment_complexes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  address text,
  legal_dong_code text,
  built_year int,
  household_count int,
  parking_count int,
  floor_area_ratio numeric,
  building_coverage_ratio numeric,
  builder text,
  brand text,
  transit_note text,
  school_note text,
  infrastructure_note text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apartment_listings (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid not null references public.apartment_complexes(id) on delete cascade,
  building_no text,
  deal_type text not null check (deal_type in ('매매', '전세', '월세')),
  price bigint,
  deposit bigint,
  monthly_rent bigint,
  supply_area_m2 numeric,
  exclusive_area_m2 numeric not null check (exclusive_area_m2 > 0),
  area_type text,
  floor_text text,
  floor int,
  total_floor int,
  floor_group text,
  direction text,
  verified_date date,
  registered_date date,
  agent_name text,
  agent_count int,
  source text,
  description text,
  raw_text text,
  is_favorite boolean not null default false,
  is_duplicate_candidate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apartment_listings_price_rule check (
    (deal_type = '매매' and price > 0)
    or (deal_type = '전세' and coalesce(deposit, price) > 0)
    or (deal_type = '월세' and deposit >= 0 and monthly_rent > 0)
  )
);

create table if not exists public.apartment_actual_transactions (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid references public.apartment_complexes(id) on delete set null,
  legal_dong_code text,
  legal_dong_name text,
  original_complex_name text,
  deal_year int,
  deal_month int,
  deal_day int,
  deal_date date,
  price bigint not null,
  exclusive_area_m2 numeric,
  floor int,
  built_year int,
  road_name text,
  jibun text,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comparison_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comparison_group_complexes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.comparison_groups(id) on delete cascade,
  complex_id uuid not null references public.apartment_complexes(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (group_id, complex_id)
);

create index if not exists idx_listings_complex_area
  on public.apartment_listings (complex_id, exclusive_area_m2);
create index if not exists idx_listings_verified_date
  on public.apartment_listings (verified_date desc);
create index if not exists idx_group_complexes_group
  on public.comparison_group_complexes (group_id, sort_order);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complexes_updated_at on public.apartment_complexes;
create trigger complexes_updated_at before update on public.apartment_complexes
for each row execute function public.set_updated_at();

drop trigger if exists listings_updated_at on public.apartment_listings;
create trigger listings_updated_at before update on public.apartment_listings
for each row execute function public.set_updated_at();

drop trigger if exists transactions_updated_at on public.apartment_actual_transactions;
create trigger transactions_updated_at before update on public.apartment_actual_transactions
for each row execute function public.set_updated_at();

drop trigger if exists groups_updated_at on public.comparison_groups;
create trigger groups_updated_at before update on public.comparison_groups
for each row execute function public.set_updated_at();

create or replace view public.v_listing_area_summary as
select
  c.id as complex_id,
  c.name as complex_name,
  case
    when l.exclusive_area_m2 >= 55 and l.exclusive_area_m2 < 65 then '59'
    when l.exclusive_area_m2 >= 70 and l.exclusive_area_m2 < 80 then '74'
    when l.exclusive_area_m2 >= 80 and l.exclusive_area_m2 < 90 then '84'
    when l.exclusive_area_m2 >= 95 and l.exclusive_area_m2 < 105 then '99'
    when l.exclusive_area_m2 >= 108 and l.exclusive_area_m2 < 118 then '113'
    when l.exclusive_area_m2 >= 124 and l.exclusive_area_m2 < 134 then '129'
    when l.exclusive_area_m2 >= 143 and l.exclusive_area_m2 < 153 then '148'
    else '기타'
  end as area_group,
  count(*)::int as listing_count,
  min(l.price) as min_price,
  max(l.price) as max_price,
  avg(l.price)::numeric as avg_price,
  percentile_cont(0.5) within group (order by l.price)::numeric as median_price,
  max(l.verified_date) as latest_verified_date
from public.apartment_listings l
join public.apartment_complexes c on c.id = l.complex_id
where l.deal_type = '매매' and l.price is not null
group by c.id, c.name, area_group;

create or replace view public.v_transaction_area_summary as
select
  c.id as complex_id,
  c.name as complex_name,
  case
    when t.exclusive_area_m2 >= 55 and t.exclusive_area_m2 < 65 then '59'
    when t.exclusive_area_m2 >= 70 and t.exclusive_area_m2 < 80 then '74'
    when t.exclusive_area_m2 >= 80 and t.exclusive_area_m2 < 90 then '84'
    when t.exclusive_area_m2 >= 95 and t.exclusive_area_m2 < 105 then '99'
    when t.exclusive_area_m2 >= 108 and t.exclusive_area_m2 < 118 then '113'
    when t.exclusive_area_m2 >= 124 and t.exclusive_area_m2 < 134 then '129'
    when t.exclusive_area_m2 >= 143 and t.exclusive_area_m2 < 153 then '148'
    else '기타'
  end as area_group,
  count(*)::int as transaction_count,
  min(t.price) as min_price,
  max(t.price) as max_price,
  avg(t.price)::numeric as avg_price,
  percentile_cont(0.5) within group (order by t.price)::numeric as median_price,
  max(t.deal_date) as latest_deal_date
from public.apartment_actual_transactions t
join public.apartment_complexes c on c.id = t.complex_id
group by c.id, c.name, area_group;

create or replace view public.v_listing_vs_transaction_summary as
select
  l.*,
  t.transaction_count,
  t.avg_price as transaction_avg_price,
  t.median_price as transaction_median_price,
  case when t.avg_price > 0
    then ((l.avg_price - t.avg_price) / t.avg_price) * 100
    else null
  end as asking_premium_rate
from public.v_listing_area_summary l
left join public.v_transaction_area_summary t
  on t.complex_id = l.complex_id and t.area_group = l.area_group;

alter table public.apartment_complexes enable row level security;
alter table public.apartment_listings enable row level security;
alter table public.apartment_actual_transactions enable row level security;
alter table public.comparison_groups enable row level security;
alter table public.comparison_group_complexes enable row level security;

-- MVP policy: an anon-key deployment can manage manually entered data.
-- Replace these policies with authenticated-admin rules before public release.
drop policy if exists "mvp public complexes" on public.apartment_complexes;
create policy "mvp public complexes" on public.apartment_complexes for all to anon, authenticated
  using (true) with check (true);
drop policy if exists "mvp public listings" on public.apartment_listings;
create policy "mvp public listings" on public.apartment_listings for all to anon, authenticated
  using (true) with check (true);
drop policy if exists "mvp public transactions" on public.apartment_actual_transactions;
create policy "mvp public transactions" on public.apartment_actual_transactions for all to anon, authenticated
  using (true) with check (true);
drop policy if exists "mvp public groups" on public.comparison_groups;
create policy "mvp public groups" on public.comparison_groups for all to anon, authenticated
  using (true) with check (true);
drop policy if exists "mvp public group complexes" on public.comparison_group_complexes;
create policy "mvp public group complexes" on public.comparison_group_complexes for all to anon, authenticated
  using (true) with check (true);
