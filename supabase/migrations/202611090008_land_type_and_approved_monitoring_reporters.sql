alter table public.planting_projects add column if not exists land_ownership_type text;
alter table public.planting_projects drop constraint if exists planting_projects_land_ownership_type_check;
alter table public.planting_projects add constraint planting_projects_land_ownership_type_check
check (land_ownership_type is null or land_ownership_type in ('Community Land','Government Forest Reserve','Private Farmland','Institutional Campus','Other'));
drop policy if exists survival_logs_owner_insert on public.tree_survival_logs;
create policy survival_logs_owner_insert on public.tree_survival_logs
for insert to authenticated with check (
  reporter_id = (select auth.uid()) and reviewer_approved = false
  and review_status = 'pending' and reviewed_by is null and reviewed_at is null
  and exists (select 1 from public.profiles prof where prof.id = (select auth.uid()) and prof.approval_status = 'approved')
  and exists (select 1 from public.tree_registry tr join public.planting_projects p on p.id = tr.project_id
    where tr.id = tree_survival_logs.tree_id
      and (tr.created_by = (select auth.uid()) or p.owner_id = (select auth.uid()))
      and tr.verification_status in ('submitted','under_review','verified'))
);
