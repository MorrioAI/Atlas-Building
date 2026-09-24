# ADR-0007: Maintenance mode is a database flag, not a deploy

**Status:** Accepted

## Context
Taking the site down for a migration should not require the thing you are most likely to have
just broken: a working deploy pipeline. An environment variable needs a redeploy to change, and
a redeploy during an incident is a second risk stacked on the first.

## Decision
A boolean row in the database, read in middleware behind a short in-process cache.

Four properties, each chosen against a specific failure:

- **503, not a redirect.** A redirect lets a crawler index the outage page as the site itself,
  and that outlives the window by weeks. A 503 with `Retry-After` says "come back", and crawlers
  honour it.
- **Fail open.** A missing table, an unreachable database or a malformed row leaves the site
  running. The switch failing must not become the outage.
- **Exempt the paths whose failure outlives the window.** The admin surface holding the off
  switch — locking yourself out is the obvious way for this to go wrong. Payment webhooks, which
  a provider retries for a while and then stops. Scheduled jobs. Error reporting, because an
  error raised during maintenance is the one most worth hearing about.
- **Per-environment by construction.** The flag lives in each environment's own database, so
  staging going down cannot take production with it. That is a property of where the value
  lives, not of a check somebody has to remember to write.

## Consequences
The switch can be flipped by anyone with database access, in seconds, with no deploy — including
when the pipeline is the thing that is broken.

The cost is one read per request. The in-process cache holds the value briefly, so flipping the
switch takes effect within that window rather than instantly. That is the right trade for a
control used a few times a year: a stale "up" for a few seconds is cheaper than a database read
on the hot path of every request forever.

Middleware runs on the edge runtime, so this code imports nothing and talks to the database over
HTTP — the constraint is explained in
[Error Reporting](../engineering/error-reporting.md#the-runtime-trap).

Implementation: `src/middleware.ts`, `src/lib/maintenance.ts`, `src/app/maintenance/page.tsx`.
