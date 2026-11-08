-- 200 Billion Trees: moderated community photo/video posts.
-- Apply only after the intended Supabase Free project is connected and reviewed.
create table if not exists public.community_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 caption text not null default '',
 media_path text not null unique,
 media_type text not null check (media_type in ('image','video')),
 moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected','removed')),
 consent_confirmed boolean not null default false,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references public.profiles(id) on delete set null,
 constraint community_caption_length check (char_length(caption) <= 2000)
);
create index if not exists community_posts_author_idx on public.community_posts(author_id);
create index if not exists community_posts_public_idx on public.community_posts(moderation_status, created_at desc);
alter table public.community_posts enable row level security;
create policy "community_posts_read_own_or_approved" on public.community_posts for select to anon, authenticated
using (moderation_status = 'approved' or author_id = (select auth.uid()));
create policy "community_posts_insert_approved_member" on public.community_posts for insert to authenticated
with check (author_id = (select auth.uid()) and consent_confirmed = true and exists (
 select 1 from public.profiles p where p.id = (select auth.uid()) and p.approval_status = 'approved'
));
create policy "community_posts_delete_own_pending" on public.community_posts for delete to authenticated
using (author_id = (select auth.uid()) and moderation_status = 'pending');
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('community-media','community-media',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public=false,file_size_limit=52428800,allowed_mime_types=excluded.allowed_mime_types;
create policy "community_media_upload_approved_member" on storage.objects for insert to authenticated
with check (bucket_id='community-media' and owner_id=(select auth.uid())::text and exists (
 select 1 from public.profiles p where p.id=(select auth.uid()) and p.approval_status='approved'
));
create policy "community_media_read_own_or_approved_post" on storage.objects for select to authenticated
using (bucket_id='community-media' and (owner_id=(select auth.uid())::text or exists (
 select 1 from public.community_posts cp where cp.media_path=name and cp.moderation_status='approved'
)));
create policy "community_media_delete_own" on storage.objects for delete to authenticated
using (bucket_id='community-media' and owner_id=(select auth.uid())::text);
