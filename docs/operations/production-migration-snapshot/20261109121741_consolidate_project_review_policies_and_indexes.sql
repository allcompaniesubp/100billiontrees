drop policy if exists projects_staff_read on public.planting_projects;
drop policy if exists projects_read_approved_or_owner on public.planting_projects;
create policy projects_read_approved_or_owner on public.planting_projects
for select to anon, authenticated
using (project_status = 'approved' or owner_id = (select auth.uid()) or private.is_staff());

drop policy if exists projects_staff_review on public.planting_projects;
drop policy if exists projects_update_own_draft on public.planting_projects;
create policy projects_update_own_draft on public.planting_projects
for update to authenticated
using ((owner_id = (select auth.uid()) and project_status = 'draft') or private.is_staff())
with check ((owner_id = (select auth.uid()) and project_status = 'draft') or private.is_staff());

create index if not exists planting_projects_reviewed_by_idx on public.planting_projects(reviewed_by);
create index if not exists tree_survival_logs_reviewed_by_idx on public.tree_survival_logs(reviewed_by);

