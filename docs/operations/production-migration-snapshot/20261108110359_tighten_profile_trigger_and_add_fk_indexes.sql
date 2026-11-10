create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
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

revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;

create index if not exists audit_events_actor_idx on public.audit_events(actor_id);
create index if not exists certificates_project_idx on public.certificates(project_id);
create index if not exists community_posts_reviewed_by_idx on public.community_posts(reviewed_by);
create index if not exists monitoring_checks_inspected_by_idx on public.monitoring_checks(inspected_by);
create index if not exists planting_events_species_idx on public.planting_events(species_id);
