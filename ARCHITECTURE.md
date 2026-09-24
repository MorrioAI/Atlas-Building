# Architecture

Atlas turns real work into verifiable capability evidence. Three layers:

```
            ┌──────────────────────────────────────────┐
  Product   │ AI Profile · Capability Challenge ·       │
  surfaces  │ AI Video Intro · AI Internship            │
            └───────────────┬──────────────────────────┘
                            │ signals (deliverables, transcripts, reviews)
            ┌───────────────▼──────────────────────────┐
  AI layer  │ Claude orchestration → structured scores  │
            └───────────────┬──────────────────────────┘
                            │
            ┌───────────────▼──────────────────────────┐
  Talent    │ The Talent Algorithm — 7 dimensions,      │
  Algorithm │ score + confidence, evidence-linked       │
            └───────────────┬──────────────────────────┘
                            │
  Data      │ Supabase (Postgres, RLS, Storage)         │
```

## Principles

1. **Evidence over claims.** Every score links back to the artifact that produced it. See [ADR-0003](./docs/adr/0003-evidence-over-claims.md).
2. **Judgment, not output.** We measure how someone thinks under a constraint.
3. **Confidence is first-class.** A score with two signals is not a score with twenty. We surface confidence, never a false precision.
4. **Fail open on non-critical paths, fail loud on trust.** Scoring bugs are trust bugs — they block release.
5. **One exception to failing open: money.** An availability check that gates *taking payment* fails closed. Hiding a feature for the length of an outage is not comparable to charging for work nobody can perform. See [ADR-0004](./docs/adr/0004-availability-checks-that-gate-payment-fail-closed.md).
6. **Access is decided by the database, never by where a file happens to sit.** Private media is served through a route that reads the row and redirects to a short-lived signed URL. See [ADR-0005](./docs/adr/0005-media-access-decided-by-the-database.md).

## Key modules

- `src/lib/talent` — the scoring engine. The core IP. Pure functions, heavily tested.
- `src/lib/ai` — the Claude client and prompt orchestration. The client is wrapped so every call is metered ([ADR-0006](./docs/adr/0006-cost-metered-at-the-client.md)); the ledger and the two spend knobs are in `usage.ts`.
- `src/lib/media` — path helpers and the access decision behind private media.
- `src/lib/expert-review` — availability for the paid human review surface.
- `src/lib/observability` — the error reporter. Imports nothing, on purpose.
- `src/lib/maintenance` — the maintenance switch, read in middleware.
- `src/lib/supabase` — server + browser clients (`@supabase/ssr`), plus a service-role client used only *after* an access decision.
- `src/app/api` — thin route handlers; business logic lives in `lib`.
- `supabase/migrations` — the schema the above depends on.

## Runtimes

`src/middleware.ts` and anything it imports are compiled for the edge runtime as
well as Node. Modules reachable from middleware import nothing and speak HTTP —
the trap and the reasoning are in
[Error Reporting](./docs/engineering/error-reporting.md#the-runtime-trap).

See per-decision records in [`docs/adr`](./docs/adr).
