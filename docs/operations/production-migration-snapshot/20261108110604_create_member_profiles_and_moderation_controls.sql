create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create policy "community_posts_moderator_update"
on public.community_posts
for update to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('administrator','reviewer')
)
with check (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('administrator','reviewer')
);

create policy "community_posts_moderator_read_all"
on public.community_posts
for select to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('administrator','reviewer')
);
