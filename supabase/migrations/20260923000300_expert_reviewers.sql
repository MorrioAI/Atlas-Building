-- Expert Review availability is a live count, not a feature flag: onboarding
-- the first reviewer *is* the switch, in both directions.
-- See docs/adr/0004-availability-checks-that-gate-payment-fail-closed.md.

create type reviewer_status as enum ('onboarding', 'accepting', 'paused');

create table expert_reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status reviewer_status not null default 'onboarding',
  created_at timestamptz not null default now()
);

-- The availability check counts 'accepting' rows on every gated request.
create index expert_reviewers_accepting_idx on expert_reviewers (status)
  where status = 'accepting';

alter table expert_reviewers enable row level security;

-- Anyone may learn *whether* the surface is available. Who the reviewers are is
-- not part of that answer, so only the status column is worth exposing — the
-- availability check reads a count, never a row.
create policy expert_reviewers_status_is_public on expert_reviewers
  for select
  using (true);
