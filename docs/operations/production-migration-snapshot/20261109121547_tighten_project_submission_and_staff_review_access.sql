drop policy if exists projects_insert_own on public.planting_projects;
create policy projects_insert_own on public.planting_projects
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and project_status in ('draft','submitted')
  and ecological_review_status in ('not_reviewed','in_review')
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.approval_status = 'approved'
  )
);
drop policy if exists projects_staff_read on public.planting_projects;
create policy projects_staff_read on public.planting_projects
for select to authenticated using (private.is_staff());

