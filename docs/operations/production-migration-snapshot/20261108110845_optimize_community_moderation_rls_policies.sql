drop policy if exists "community_posts_moderator_read_all" on public.community_posts;

drop policy if exists "community_posts_read_own_or_approved" on public.community_posts;
create policy "community_posts_read_own_or_approved" on public.community_posts
for select to anon, authenticated
using (
  moderation_status = 'approved'
  or author_id = (select auth.uid())
  or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') in ('administrator','reviewer')
);

drop policy if exists "community_posts_moderator_update" on public.community_posts;
create policy "community_posts_moderator_update" on public.community_posts
for update to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') in ('administrator','reviewer')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') in ('administrator','reviewer')
);
