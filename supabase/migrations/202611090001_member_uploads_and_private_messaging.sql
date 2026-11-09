-- Allow authenticated pending members to submit media for moderation.
-- Add private member-to-Foundation messaging with row-level access control.

drop policy if exists "community_posts_insert_approved_member" on public.community_posts;
drop policy if exists "community_posts_insert_member_for_moderation" on public.community_posts;
create policy "community_posts_insert_member_for_moderation"
on public.community_posts for insert to authenticated
with check (
  author_id = (select auth.uid())
  and consent_confirmed = true
  and moderation_status = 'pending'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.approval_status in ('pending','approved')
  )
);

drop policy if exists "community_media_upload_approved_member" on storage.objects;
drop policy if exists "community_media_upload_member_for_moderation" on storage.objects;
create policy "community_media_upload_member_for_moderation"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'community-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.approval_status in ('pending','approved')
  )
);

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 160),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists support_conversations_owner_created_idx
  on public.support_conversations(created_by, created_at desc);
create index if not exists support_messages_conversation_created_idx
  on public.support_messages(conversation_id, created_at);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

grant select, insert on public.support_conversations to authenticated;
grant select, insert on public.support_messages to authenticated;

drop policy if exists "support_conversations_read_owner_or_staff" on public.support_conversations;
create policy "support_conversations_read_owner_or_staff"
on public.support_conversations for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('administrator','reviewer')
  )
);

drop policy if exists "support_conversations_insert_owner" on public.support_conversations;
create policy "support_conversations_insert_owner"
on public.support_conversations for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "support_messages_read_owner_or_staff" on public.support_messages;
create policy "support_messages_read_owner_or_staff"
on public.support_messages for select to authenticated
using (
  exists (
    select 1 from public.support_conversations c
    where c.id = conversation_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role in ('administrator','reviewer')
        )
      )
  )
);

drop policy if exists "support_messages_insert_owner_or_staff" on public.support_messages;
create policy "support_messages_insert_owner_or_staff"
on public.support_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.support_conversations c
    where c.id = conversation_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role in ('administrator','reviewer')
        )
      )
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table public.support_messages;
  end if;
end $$;
