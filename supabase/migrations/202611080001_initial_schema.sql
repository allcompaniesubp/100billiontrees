-- 200 Billion Trees: initial Supabase schema
-- Apply only after connecting the intended Supabase project.
-- No paid services, payment processing, public donations, or external API keys are enabled here.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code char(2),
  organisation_name text,
  role text not null default 'member' check (role in ('member','project_coordinator','reviewer','administrator')),
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A user may update their own profile, but cannot grant themselves a role or approval.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.role = 'member';
      new.approval_status = 'pending';
    end if;
  elsif auth.uid() is not null and (
    new.role is distinct from old.role or
    new.approval_status is distinct from old.approval_status
  ) then
    raise exception 'Role and approval status can only be changed by an authorised administrator';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges_trigger on public.profiles;
create trigger protect_profile_privileges_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_privileges();

create table if not exists public.countries (
  code char(2) primary key,
  name text not null unique,
  profile_status text not null default 'draft' check (profile_status in ('draft','published')),
  created_at timestamptz not null default now()
);

create table if not exists public.tree_species (
  id uuid primary key default gen_random_uuid(),
  scientific_name text not null,
  common_names text[] not null default '{}',
  native_country_codes char(2)[] not null default '{}',
  ecological_notes text,
  suitability_status text not null default 'unreviewed'
    check (suitability_status in ('unreviewed','under_review','expert_reviewed','not_recommended')),
  source_notes text,
  created_at timestamptz not null default now(),
  unique (scientific_name)
);

create table if not exists public.planting_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  country_code char(2) references public.countries(code),
  project_name text not null,
  description text,
  site_description text,
  land_permission_status text not null default 'not_provided'
    check (land_permission_status in ('not_provided','pending','documented','not_required')),
  ecological_review_status text not null default 'not_reviewed'
    check (ecological_review_status in ('not_reviewed','in_review','approved','changes_requested','declined')),
  project_status text not null default 'draft'
    check (project_status in ('draft','submitted','approved','rejected','archived')),
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planting_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.planting_projects(id) on delete cascade,
  species_id uuid references public.tree_species(id),
  planting_date date not null,
  quantity_planted integer not null check (quantity_planted > 0),
  nursery_source text,
  evidence_status text not null default 'submitted'
    check (evidence_status in ('submitted','under_review','verified','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.monitoring_checks (
  id uuid primary key default gen_random_uuid(),
  planting_event_id uuid not null references public.planting_events(id) on delete cascade,
  inspected_on date not null,
  living_count integer not null check (living_count >= 0),
  inspected_by uuid references public.profiles(id) on delete set null,
  evidence_status text not null default 'submitted'
    check (evidence_status in ('submitted','under_review','verified','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.planting_projects(id) on delete set null,
  certificate_type text not null,
  status text not null default 'draft' check (status in ('draft','issued','revoked')),
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status <> 'issued') or issued_at is not null)
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists planting_projects_owner_idx on public.planting_projects(owner_id);
create index if not exists planting_projects_country_idx on public.planting_projects(country_code);
create index if not exists planting_events_project_idx on public.planting_events(project_id);
create index if not exists monitoring_checks_event_idx on public.monitoring_checks(planting_event_id);
create index if not exists certificates_recipient_idx on public.certificates(recipient_id);

alter table public.profiles enable row level security;
alter table public.countries enable row level security;
alter table public.tree_species enable row level security;
alter table public.planting_projects enable row level security;
alter table public.planting_events enable row level security;
alter table public.monitoring_checks enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_events enable row level security;

-- Profiles: users can see and edit only their own profile.
create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Published reference data is readable; changes are reserved for trusted server/admin operations.
create policy "countries_read_published" on public.countries
for select to anon, authenticated using (profile_status = 'published');
create policy "species_read_reviewed" on public.tree_species
for select to anon, authenticated using (suitability_status = 'expert_reviewed');

-- Members can read their own projects; public visitors can read approved projects.
create policy "projects_read_approved_or_owner" on public.planting_projects
for select to anon, authenticated
using (project_status = 'approved' or owner_id = (select auth.uid()));
create policy "projects_insert_own" on public.planting_projects
for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy "projects_update_own_draft" on public.planting_projects
for update to authenticated
using (owner_id = (select auth.uid()) and project_status in ('draft','changes_requested'))
with check (owner_id = (select auth.uid()) and project_status in ('draft','changes_requested'));

-- Planting and monitoring records are visible only to the project owner for now.
create policy "planting_events_owner_read" on public.planting_events
for select to authenticated
using (exists (
  select 1 from public.planting_projects p
  where p.id = project_id and p.owner_id = (select auth.uid())
));
create policy "planting_events_owner_insert" on public.planting_events
for insert to authenticated
with check (exists (
  select 1 from public.planting_projects p
  where p.id = project_id and p.owner_id = (select auth.uid())
));

create policy "monitoring_owner_read" on public.monitoring_checks
for select to authenticated
using (exists (
  select 1
  from public.planting_events e
  join public.planting_projects p on p.id = e.project_id
  where e.id = planting_event_id and p.owner_id = (select auth.uid())
));
create policy "monitoring_owner_insert" on public.monitoring_checks
for insert to authenticated
with check (exists (
  select 1
  from public.planting_events e
  join public.planting_projects p on p.id = e.project_id
  where e.id = planting_event_id and p.owner_id = (select auth.uid())
));

create policy "certificates_recipient_read" on public.certificates
for select to authenticated
using (recipient_id = (select auth.uid()));

-- Audit records are not exposed to browser clients.
