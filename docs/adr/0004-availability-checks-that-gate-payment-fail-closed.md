# ADR-0004: Availability checks that gate payment fail closed

**Status:** Accepted

## Context
Almost everything in Atlas should fail open. If the flag store is unreachable, the site stays
up. A missing environment variable must not take the product down. `ARCHITECTURE.md` states it
as a principle: fail open on non-critical paths, fail loud on trust.

There is one shape of exception, and it reads like a bug unless it is written down.

Expert Review is a paid, human-delivered surface: someone pays, and a qualified reviewer does
the work. "Is Expert Review available?" is answered by asking whether any reviewer is onboarded
and accepting. When that query fails — the database is down, the table is missing, the request
times out — we have to choose a default.

Guessing "available" takes someone's money for work nobody will perform. Guessing "unavailable"
hides a feature for the length of the outage. These are not comparable.

## Decision
An availability check that gates **taking money** fails **closed**. Every other availability
check in the codebase continues to fail open.

Two supporting rules:

- **A live count is the switch, not a feature flag.** Availability is derived from a count of
  onboarded, accepting reviewers. Onboarding the first person *is* the switch, in both
  directions. A flag would be a second thing to remember, and it fails by staying off.
- **Guard the server, not just the UI.** Hiding a button is a courtesy. A stale tab and a direct
  `POST` both ignore it, so the check runs again in the route handler before anything is
  charged.

The asymmetry is commented at the point it occurs, because a reader who knows the fail-open
principle will otherwise read it as a mistake.

## Consequences
An outage in the reviewer store makes Expert Review look unavailable rather than making it
oversold. Refunds and an unservable queue cost more than a hidden feature, and cost trust as
well as money.

The cost is a false negative: a database blip can hide a surface that was in fact available.
That is recoverable by waiting. The other direction is recoverable only by apologising.

Implementation: `src/lib/expert-review/availability.ts`.
