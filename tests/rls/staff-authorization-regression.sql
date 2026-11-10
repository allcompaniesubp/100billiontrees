-- Isolated PostgreSQL regression harness for the proposed Supabase RLS patch.
-- Runs only in GitHub Actions' disposable PostgreSQL service; never targets production.

\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema private;
create schema storage;

grant usage on schema auth, private, storage, public to anon, authenticated;

create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

create function storage.foldername(name text) returns text[]
language sql immutable
as $$
  select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)]
$$;

create table public.profiles (
  id uuid primary key,
  role text not null,
  approval_status text not null
);

create table public.community_posts (
  id uuid primary key,
  author_id uuid not null,
  caption text not null,
  media_path text,
  media_type text,
  moderation_status text not null,
  consent_confirmed boolean not null default true,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create table public.support_conversations (
  id uuid primary key,
  created_by uuid not null,
  subject text not null,
  status text not null default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.support_messages (
  id uuid primary key,
  conversation_id uuid not null references public.support_conversations(id),
  sender_id uuid not null,
  body text not null,
  created_at timestamptz default now()
);

create table storage.objects (
  id uuid primary key,
  bucket_id text not null,
  name text not null,
  owner_id text
);

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.community_posts to anon, authenticated;
grant select, insert on public.support_conversations to authenticated;
grant select, insert on public.support_messages to authenticated;
grant select, insert, delete on storage.objects to authenticated;

alter table public.community_posts enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table storage.objects enable row level security;

create function private.is_staff() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('administrator', 'reviewer')
      and p.approval_status = 'approved'
  );
$$;
grant execute on function private.is_staff() to authenticated;

insert into public.profiles(id, role, approval_status) values
('00000000-0000-0000-0000-000000000001','administrator','approved'),
('00000000-0000-0000-0000-000000000002','reviewer','approved'),
('00000000-0000-0000-0000-000000000003','member','approved'),
('00000000-0000-0000-0000-000000000004','member','pending'),
('00000000-0000-0000-0000-000000000005','reviewer','rejected'),
('00000000-0000-0000-0000-000000000006','member','approved');

insert into public.community_posts(id,author_id,caption,media_path,media_type,moderation_status) values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','public approved','00000000-0000-0000-0000-000000000003/public.png','image','approved'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','pending member','00000000-0000-0000-0000-000000000004/pending.png','image','pending'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000006','pending other','00000000-0000-0000-0000-000000000006/other.png','image','pending');

insert into storage.objects(id,bucket_id,name,owner_id) values
('20000000-0000-0000-0000-000000000001','community-media','00000000-0000-0000-0000-000000000003/public.png','00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000002','community-media','00000000-0000-0000-0000-000000000004/pending.png','00000000-0000-0000-0000-000000000004'),
('20000000-0000-0000-0000-000000000003','community-media','00000000-0000-0000-0000-000000000006/other.png','00000000-0000-0000-0000-000000000006');

insert into public.support_conversations(id,created_by,subject) values
('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','member own'),
('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000006','another member');

insert into public.support_messages(id,conversation_id,sender_id,body) values
('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','own message'),
('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000006','other message');

-- Baseline policies mirror the live policy names and relevant predicates.
create policy community_posts_read_own_or_approved on public.community_posts
for select to anon, authenticated
using (
  moderation_status = 'approved'
  or author_id = (select auth.uid())
  or coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('administrator','reviewer')
);

create policy community_posts_moderator_update on public.community_posts
for update to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('administrator','reviewer'))
with check (coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('administrator','reviewer'));

create policy community_posts_insert_member_for_moderation on public.community_posts
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and consent_confirmed = true
  and moderation_status = 'pending'
  and exists (select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.approval_status in ('pending','approved'))
);

create policy community_media_read_own_or_approved_post on storage.objects
for select to authenticated
using (
  bucket_id = 'community-media'
  and (
    owner_id = (select auth.uid())::text
    or exists (select 1 from public.community_posts cp
      where cp.media_path = objects.name and cp.moderation_status = 'approved')
  )
);

create policy community_media_upload_member_for_moderation on storage.objects
for insert to authenticated
with check (
  bucket_id = 'community-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.approval_status in ('pending','approved'))
);

create policy support_conversations_insert_owner on public.support_conversations
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()))
);

create policy support_conversations_read_owner_or_staff on public.support_conversations
for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('administrator','reviewer'))
);

create policy support_messages_read_owner_or_staff on public.support_messages
for select to authenticated
using (exists (
  select 1 from public.support_conversations c
  where c.id = support_messages.conversation_id
    and (c.created_by = (select auth.uid())
      or exists (select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role in ('administrator','reviewer')))
));

create policy support_messages_insert_owner_or_staff on public.support_messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.support_conversations c
    where c.id = support_messages.conversation_id
      and (c.created_by = (select auth.uid())
        or exists (select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.role in ('administrator','reviewer')))
  )
);

-- Apply the exact review-only proposal to this disposable fixture.
\ir ../../docs/operations/proposals/staff-authorization-hardening-proposal.sql

-- Anonymous: approved posts only, no private media.
set role anon;
do $$ declare n int; begin
  select count(*) into n from public.community_posts;
  if n <> 1 then raise exception 'anon expected 1 approved post, got %', n; end if;
end $$;
reset role;

-- Ordinary approved member: approved posts + own posts; own support only.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","app_metadata":{"role":"member"}}',false);
do $$ declare n int; begin
  select count(*) into n from public.community_posts;
  if n <> 1 then raise exception 'approved member expected approved posts only, got %', n; end if;
  select count(*) into n from public.support_conversations;
  if n <> 1 then raise exception 'member expected own support conversation, got %', n; end if;
  select count(*) into n from public.support_messages;
  if n <> 1 then raise exception 'member expected own support message, got %', n; end if;
end $$;
reset role;

-- Pending member: own pending post/media only, still allowed to submit.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","app_metadata":{"role":"member"}}',false);
do $$ declare n int; begin
  select count(*) into n from public.community_posts;
  if n <> 2 then raise exception 'pending member expected approved + own pending posts, got %', n; end if;
  select count(*) into n from storage.objects where bucket_id='community-media';
  if n <> 2 then raise exception 'pending member expected approved + own media, got %', n; end if;
  insert into public.community_posts(id,author_id,caption,media_path,media_type,moderation_status,consent_confirmed)
  values ('10000000-0000-0000-0000-000000000004',auth.uid(),'pending upload test',auth.uid()::text||'/new.png','image','pending',true);
  insert into storage.objects(id,bucket_id,name,owner_id)
  values ('20000000-0000-0000-0000-000000000004','community-media',
    auth.uid()::text||'/new.png',auth.uid()::text);
end $$;
reset role;

-- Approved reviewer: all posts/media/support and can moderate.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","app_metadata":{"role":"reviewer"}}',false);
do $$ declare n int; begin
  select count(*) into n from public.community_posts;
  if n <> 4 then raise exception 'reviewer expected all 4 posts, got %', n; end if;
  select count(*) into n from storage.objects where bucket_id='community-media';
  if n <> 4 then raise exception 'reviewer expected all 4 linked media objects, got %', n; end if;
  select count(*) into n from public.support_conversations;
  if n <> 2 then raise exception 'reviewer expected all support conversations, got %', n; end if;
  update public.community_posts
    set moderation_status='approved',
        reviewed_by=auth.uid(), reviewed_at=now()
    where id='10000000-0000-0000-0000-000000000002';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'reviewer expected to approve one post, updated %', n; end if;
end $$;
reset role;

-- Approved administrator: same current-profile staff access as reviewer.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"administrator"}}',false);
do $ declare n int; begin
  select count(*) into n from public.community_posts;
  if n <> 4 then raise exception 'administrator expected all 4 posts, got %', n; end if;
  select count(*) into n from storage.objects where bucket_id='community-media';
  if n <> 4 then raise exception 'administrator expected all 4 linked media objects, got %', n; end if;
  select count(*) into n from public.support_conversations;
  if n <> 2 then raise exception 'administrator expected all support conversations, got %', n; end if;
end $;
reset role;

-- Former staff with a stale JWT role: current rejected profile must deny staff access.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000005","app_metadata":{"role":"reviewer"}}',false);
do $$ declare n int; begin
  select count(*) into n from public.community_posts;
  if n <> 2 then raise exception 'rejected former staff expected approved posts only, got %', n; end if;
  select count(*) into n from storage.objects where bucket_id='community-media';
  if n <> 2 then raise exception 'former staff expected approved media only, got %', n; end if;
  select count(*) into n from public.support_conversations;
  if n <> 0 then raise exception 'former staff expected no support inbox access, got %', n; end if;
  update public.community_posts set moderation_status='rejected'
    where id='10000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'former staff unexpectedly updated % posts', n; end if;
end $$;
reset role;

\echo 'PASS: isolated RLS policy regression checks completed.'
