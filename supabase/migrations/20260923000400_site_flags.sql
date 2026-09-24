-- The maintenance switch. A row, not an environment variable: flipping it needs
-- no deploy, which matters most when the deploy pipeline is what broke.
-- See docs/adr/0007-maintenance-mode-is-a-database-flag.md.

create table site_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into site_flags (key, enabled) values ('maintenance', false);

alter table site_flags enable row level security;

-- Middleware reads this with the anon key on every request, so the read must be
-- public. The flag is a boolean about the site's own state; there is nothing in
-- it that is not already obvious from trying to load a page.
create policy site_flags_are_readable on site_flags
  for select
  using (true);

-- Writes are the admin surface's job, via the service role. No write policy.
