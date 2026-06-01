create extension if not exists pgcrypto;

create table if not exists public.memorials (
  id uuid primary key default gen_random_uuid(),
  creator_account_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  slug text not null unique,
  born_on date,
  died_on date,
  image_url text,
  summary text not null,
  donation_mpesa text,
  donation_bank text,
  donation_paypal text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.eulogy_entries (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  author_name text not null,
  story text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.memorial_photos (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  image_url text not null,
  storage_path text,
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.memorials add column if not exists creator_account_id uuid references auth.users(id) on delete set null;
alter table public.memorials add column if not exists donation_mpesa text;
alter table public.memorials add column if not exists donation_bank text;
alter table public.memorials add column if not exists donation_paypal text;

create index if not exists memorials_created_at_idx on public.memorials (created_at desc);
create index if not exists memorials_slug_idx on public.memorials (slug);
create index if not exists memorials_creator_account_id_idx on public.memorials (creator_account_id);
create index if not exists eulogy_entries_memorial_id_idx on public.eulogy_entries (memorial_id, created_at desc);
create index if not exists memorial_photos_memorial_id_idx on public.memorial_photos (memorial_id, position);

alter table public.memorials enable row level security;
alter table public.eulogy_entries enable row level security;
alter table public.memorial_photos enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'eulogy-photos',
  'eulogy-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Published memorials are public" on public.memorials;
drop policy if exists "Creators can create memorials" on public.memorials;
drop policy if exists "Creators can update their memorials" on public.memorials;
drop policy if exists "Creators can delete their memorials" on public.memorials;
drop policy if exists "Visitors can create memorials" on public.memorials;
drop policy if exists "Visitors can delete memorials" on public.memorials;

drop policy if exists "Published eulogy entries are public" on public.eulogy_entries;
drop policy if exists "Visitors can submit eulogy entries" on public.eulogy_entries;
drop policy if exists "Creators can delete eulogy entries" on public.eulogy_entries;
drop policy if exists "Visitors can delete eulogy entries" on public.eulogy_entries;

drop policy if exists "Public memorial photos are readable" on public.memorial_photos;
drop policy if exists "Visitors can submit memorial photo records" on public.memorial_photos;
drop policy if exists "Creators can delete memorial photo records" on public.memorial_photos;
drop policy if exists "Visitors can delete memorial photo records" on public.memorial_photos;

drop policy if exists "Anyone can view eulogy photo files" on storage.objects;
drop policy if exists "Visitors can upload eulogy photo files" on storage.objects;
drop policy if exists "Memorial creators can delete eulogy photo files" on storage.objects;

create policy "Published memorials are public"
on public.memorials
for select
using (published = true);

create policy "Creators can create memorials"
on public.memorials
for insert
to authenticated
with check (
  published = true
  and creator_account_id = auth.uid()
);

create policy "Creators can update their memorials"
on public.memorials
for update
to authenticated
using (
  creator_account_id = auth.uid()
  or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
)
with check (
  creator_account_id = auth.uid()
  or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);

create policy "Creators can delete their memorials"
on public.memorials
for delete
to authenticated
using (
  creator_account_id = auth.uid()
  or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);

create policy "Published eulogy entries are public"
on public.eulogy_entries
for select
using (
  published = true
  and exists (
    select 1
    from public.memorials
    where memorials.id = eulogy_entries.memorial_id
      and memorials.published = true
  )
);

create policy "Visitors can submit eulogy entries"
on public.eulogy_entries
for insert
to anon, authenticated
with check (
  published = true
  and exists (
    select 1
    from public.memorials
    where memorials.id = eulogy_entries.memorial_id
      and memorials.published = true
  )
);

create policy "Creators can delete eulogy entries"
on public.eulogy_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.memorials
    where memorials.id = eulogy_entries.memorial_id
      and (
        memorials.creator_account_id = auth.uid()
        or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
      )
  )
);

create policy "Public memorial photos are readable"
on public.memorial_photos
for select
using (
  exists (
    select 1
    from public.memorials
    where memorials.id = memorial_photos.memorial_id
      and memorials.published = true
  )
);

create policy "Visitors can submit memorial photo records"
on public.memorial_photos
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.memorials
    where memorials.id = memorial_photos.memorial_id
      and memorials.published = true
  )
);

create policy "Creators can delete memorial photo records"
on public.memorial_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.memorials
    where memorials.id = memorial_photos.memorial_id
      and (
        memorials.creator_account_id = auth.uid()
        or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
      )
  )
);

create policy "Anyone can view eulogy photo files"
on storage.objects
for select
using (bucket_id = 'eulogy-photos');

create policy "Visitors can upload eulogy photo files"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'eulogy-photos');

create policy "Memorial creators can delete eulogy photo files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'eulogy-photos'
  and exists (
    select 1
    from public.memorials
    where memorials.slug = (storage.foldername(name))[1]
      and (
        memorials.creator_account_id = auth.uid()
        or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
      )
  )
);
