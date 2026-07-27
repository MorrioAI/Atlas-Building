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

## Key modules

- `src/lib/talent` — the scoring engine. The core IP. Pure functions, heavily tested.
- `src/lib/ai` — the Claude client and prompt orchestration.
- `src/lib/supabase` — server + browser clients (`@supabase/ssr`).
- `src/app/api` — thin route handlers; business logic lives in `lib`.

See per-decision records in [`docs/adr`](./docs/adr).
