-- Extend the existing project and tree registry model; do not create parallel tables.
alter table public.planting_projects
  add column if not exists country_name text,
  add column if not exists state_province text,
  add column if not exists district text,
  add column if not exists locality text,
  add column if not exists gps_boundary jsonb,
  add column if not exists partner_organisation text,
  add column if not exists expected_completion_date date,
  add column if not exists tree_target integer,
  add column if not exists supported_species text[] not null default '{}',
  add column if not exists supporting_documents_paths text[] not null default '{}',
  add column if not exists project_images_paths text[] not null default '{}',
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists submitted_at timestamptz;
alter table public.planting_projects
  add constraint planting_projects_tree_target_positive check (tree_target is null or tree_target > 0),
  add constraint planting_projects_dates_valid check (expected_completion_date is null or start_date is null or expected_completion_date >= start_date);
create index if not exists planting_projects_country_name_idx on public.planting_projects(country_name);
create index if not exists planting_projects_owner_status_idx on public.planting_projects(owner_id, project_status);

-- Project owners may only edit drafts; staff review is explicitly separated.
drop policy if exists projects_staff_review on public.planting_projects;
create policy projects_staff_review on public.planting_projects
for update to authenticated
using (private.is_staff())
with check (private.is_staff());

-- Per-tree, longitudinal survival observations. Private evidence paths and exact GPS are never public.
create table if not exists public.tree_survival_logs (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.tree_registry(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  milestone text not null check (milestone in ('initial_planting','30_day','90_day','6_month','12_month','annual')),
  status text not null default 'healthy'
    check (status in ('healthy','stressed','damaged_recoverable','dead_lost','replaced')),
  observed_on date not null default current_date,
  growth_height_cm numeric(8,2) check (growth_height_cm is null or growth_height_cm >= 0),
  canopy_spread_cm numeric(8,2) check (canopy_spread_cm is null or canopy_spread_cm >= 0),
  gps_latitude numeric(10,8) check (gps_latitude is null or gps_latitude between -90 and 90),
  gps_longitude numeric(11,8) check (gps_longitude is null or gps_longitude between -180 and 180),
  evidence_media_path text not null check (length(trim(evidence_media_path)) between 1 and 500),
  damage_or_disease_notes text check (damage_or_disease_notes is null or length(damage_or_disease_notes) <= 3000),
  replacement_tree_code text,
  reviewer_approved boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tree_survival_logs_tree_date_idx on public.tree_survival_logs(tree_id, observed_on desc);
create index if not exists tree_survival_logs_reporter_idx on public.tree_survival_logs(reporter_id, created_at desc);
create index if not exists tree_survival_logs_review_idx on public.tree_survival_logs(reviewer_approved, created_at desc);

alter table public.tree_survival_logs enable row level security;
revoke all on public.tree_survival_logs from anon, authenticated;
grant select, insert on public.tree_survival_logs to authenticated;
grant update (reviewer_approved, reviewed_by, reviewed_at) on public.tree_survival_logs to authenticated;

drop policy if exists survival_logs_owner_or_staff_read on public.tree_survival_logs;
create policy survival_logs_owner_or_staff_read on public.tree_survival_logs
for select to authenticated
using (
  reporter_id = (select auth.uid())
  or private.is_staff()
  or exists (
    select 1
    from public.tree_registry tr
    join public.planting_projects p on p.id = tr.project_id
    where tr.id = tree_survival_logs.tree_id and p.owner_id = (select auth.uid())
  )
);
drop policy if exists survival_logs_owner_insert on public.tree_survival_logs;
create policy survival_logs_owner_insert on public.tree_survival_logs
for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and reviewer_approved = false
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1
    from public.tree_registry tr
    join public.planting_projects p on p.id = tr.project_id
    where tr.id = tree_survival_logs.tree_id
      and (tr.created_by = (select auth.uid()) or p.owner_id = (select auth.uid()))
      and tr.verification_status in ('submitted','under_review','verified')
  )
);
drop policy if exists survival_logs_staff_review on public.tree_survival_logs;
create policy survival_logs_staff_review on public.tree_survival_logs
for update to authenticated
using (private.is_staff())
with check (private.is_staff());

-- Keep storage paths private; never grant anonymous access to survival evidence.

