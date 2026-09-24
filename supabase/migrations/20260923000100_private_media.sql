-- Private media: the database decides, the bucket does not.
-- See docs/adr/0005-media-access-decided-by-the-database.md.

insert into storage.buckets (id, name, public)
values ('video-intros', 'video-intros', false)
on conflict (id) do update set public = false;   -- private, even if it was not

create type media_visibility as enum ('public', 'unlisted', 'private');

create table video_intros (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  storage_key text not null unique,
  visibility media_visibility not null default 'private',
  removed_at timestamptz,          -- set by a moderator; outranks visibility
  created_at timestamptz not null default now()
);

create index video_intros_owner_idx on video_intros (owner_id);

alter table video_intros enable row level security;

-- The API route makes the access decision (src/lib/media/access.ts) and signs
-- with the service role. These policies are the second lock, not the only one.
create policy video_intros_owner_reads on video_intros
  for select
  using (auth.uid() = owner_id);

create policy video_intros_public_reads on video_intros
  for select
  using (removed_at is null and visibility in ('public', 'unlisted'));

create policy video_intros_owner_writes on video_intros
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
