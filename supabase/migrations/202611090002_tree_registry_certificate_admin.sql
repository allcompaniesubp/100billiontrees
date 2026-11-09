-- Tree-level GPS records and protected certificate administration.
-- The same schema was applied and verified on the connected Supabase project.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('administrator','reviewer')
      and p.approval_status = 'approved');
$$;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'administrator'
      and p.approval_status = 'approved');
$$;
revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

drop policy if exists profiles_select_admin_directory on public.profiles;
create policy profiles_select_admin_directory on public.profiles
for select to authenticated using (private.is_staff());

alter table public.certificates
  add column if not exists recipient_name_snapshot text not null default 'Recipient',
  add column if not exists verification_code text;
update public.certificates set verification_code =
  upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))
where verification_code is null;
alter table public.certificates alter column verification_code set not null;
create unique index if not exists certificates_verification_code_uidx
  on public.certificates(verification_code);
alter table public.certificates alter column certificate_number set default (
  '200BT-' || to_char(now(),'YYYY') || '-' ||
  upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))
);

drop policy if exists certificates_recipient_read on public.certificates;
drop policy if exists certificates_read_recipient_or_admin on public.certificates;
create policy certificates_read_recipient_or_admin on public.certificates
for select to authenticated
using (recipient_id = (select auth.uid()) or private.is_admin());
drop policy if exists certificates_public_verify_issued on public.certificates;
create policy certificates_public_verify_issued on public.certificates
for select to anon, authenticated using (status = 'issued');
drop policy if exists certificates_admin_create on public.certificates;
create policy certificates_admin_create on public.certificates
for insert to authenticated with check (private.is_admin());
drop policy if exists certificates_admin_update on public.certificates;
create policy certificates_admin_update on public.certificates
for update to authenticated using (private.is_admin()) with check (private.is_admin());

create table if not exists public.tree_registry (
  id uuid primary key default gen_random_uuid(),
  tree_code text not null unique default (
    '200BT-T-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))
  ),
  project_id uuid not null references public.planting_projects(id) on delete cascade,
  planting_event_id uuid references public.planting_events(id) on delete set null,
  species_id uuid references public.tree_species(id) on delete set null,
  species_name text not null check (char_length(species_name) between 2 and 160),
  planted_on date not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  gps_accuracy_m double precision check (gps_accuracy_m is null or gps_accuracy_m >= 0),
  location_source text not null default 'gps' check (location_source in ('gps','manual')),
  evidence_media_path text,
  notes text check (notes is null or char_length(notes) <= 2000),
  verification_status text not null default 'submitted'
    check (verification_status in ('submitted','under_review','verified','rejected')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz
);
create index if not exists tree_registry_project_idx on public.tree_registry(project_id, created_at desc);
create index if not exists tree_registry_status_idx on public.tree_registry(verification_status, created_at desc);
create index if not exists tree_registry_location_idx on public.tree_registry(latitude, longitude);
alter table public.tree_registry enable row level security;
grant select, insert on public.tree_registry to authenticated;
grant update (verification_status, reviewed_by, reviewed_at, notes) on public.tree_registry to authenticated;
drop policy if exists tree_registry_owner_or_staff_read on public.tree_registry;
create policy tree_registry_owner_or_staff_read on public.tree_registry
for select to authenticated using (created_by = (select auth.uid()) or private.is_staff());
drop policy if exists tree_registry_owner_submit on public.tree_registry;
create policy tree_registry_owner_submit on public.tree_registry
for insert to authenticated with check (
  created_by = (select auth.uid()) and verification_status = 'submitted'
  and exists (select 1 from public.planting_projects p
    where p.id = project_id and p.owner_id = (select auth.uid()) and p.project_status = 'approved')
);
drop policy if exists tree_registry_staff_review on public.tree_registry;
create policy tree_registry_staff_review on public.tree_registry
for update to authenticated using (private.is_staff()) with check (private.is_staff());
