-- Public project reads expose only approved non-sensitive fields.
drop policy if exists projects_read_approved_or_owner on public.planting_projects;
drop policy if exists projects_public_read_approved on public.planting_projects;
drop policy if exists projects_authenticated_read on public.planting_projects;
create policy projects_public_read_approved on public.planting_projects
for select to anon using (project_status = 'approved');
create policy projects_authenticated_read on public.planting_projects
for select to authenticated
using (project_status = 'approved' or owner_id = (select auth.uid()) or private.is_staff());
revoke select on public.planting_projects from anon;
grant select (id, project_name, description, country_name, state_province, district, locality, tree_target, supported_species, project_status, start_date, expected_completion_date, created_at)
on public.planting_projects to anon;
