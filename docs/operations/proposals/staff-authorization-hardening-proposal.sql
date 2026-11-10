-- REVIEW ONLY — do not apply to production yet.
-- Target: Supabase project xuglowoqhbdngripaojk
-- Purpose: make staff authorization depend on the current approved profile,
-- rather than potentially stale JWT app_metadata claims.
-- Preconditions: test against a disposable PostgreSQL/Supabase environment;
-- verify private.is_staff() ownership, EXECUTE grants, and the app workflows.

begin;

-- Community post visibility:
-- anonymous visitors see approved posts only;
-- signed-in members see approved posts and their own posts;
-- approved administrators/reviewers can see all posts for moderation.
drop policy if exists "community_posts_read_own_or_approved" on public.community_posts;

create policy "community_posts_read_public_approved"
on public.community_posts
for select
to anon
using (moderation_status = 'approved');

create policy "community_posts_read_member_or_staff"
on public.community_posts
for select
to authenticated
using (
  moderation_status = 'approved'
  or author_id = (select auth.uid())
  or (select private.is_staff())
);

-- Only currently approved administrators/reviewers can moderate posts.
drop policy if exists "community_posts_moderator_update" on public.community_posts;
create policy "community_posts_moderator_update"
on public.community_posts
for update
to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

-- Permit approved staff to read private media attached to posts awaiting review.
-- Members retain access to their own uploads; approved posts remain readable
-- to signed-in users under the existing policy.
drop policy if exists "community_media_read_own_or_approved_post" on storage.objects;
create policy "community_media_read_own_or_approved_post"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'community-media'
  and (
    owner_id = (select auth.uid())::text
    or exists (
      select 1
      from public.community_posts cp
      where cp.media_path = objects.name
        and cp.moderation_status = 'approved'
    )
    or (
      (select private.is_staff())
      and exists (
        select 1
        from public.community_posts cp
        where cp.media_path = objects.name
      )
    )
  )
);

-- Support inbox staff branches use the same current, approved-staff check.
drop policy if exists "support_conversations_read_owner_or_staff" on public.support_conversations;
create policy "support_conversations_read_owner_or_staff"
on public.support_conversations
for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.is_staff())
);

drop policy if exists "support_messages_read_owner_or_staff" on public.support_messages;
create policy "support_messages_read_owner_or_staff"
on public.support_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.support_conversations c
    where c.id = support_messages.conversation_id
      and (
        c.created_by = (select auth.uid())
        or (select private.is_staff())
      )
  )
);

drop policy if exists "support_messages_insert_owner_or_staff" on public.support_messages;
create policy "support_messages_insert_owner_or_staff"
on public.support_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.support_conversations c
    where c.id = support_messages.conversation_id
      and (
        c.created_by = (select auth.uid())
        or (select private.is_staff())
      )
  )
);

commit;
