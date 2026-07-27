# Data — Metrics Standards

## Definitions before dashboards
- Every metric has a written definition, an owner, and a source query. No metric exists until it's defined.
- **North Star:** verified capability evidence created. **Guardrails:** completion rate, trust/complaint rate.

## Event naming
- `object_action`, past tense, snake_case: `challenge_completed`, `profile_shared`, `review_requested`.
- Properties are typed and documented. No free-form blobs.

## Analysis
- State the question and the decision it informs *before* you pull data.
- Report the confidence interval, not just the point estimate. Small n gets said out loud.
- Separate correlation from cause. If it's observational, label it.

## Honesty
- Show the number that's true, not the one that's flattering. A 23% retention that we understand beats a 40% we don't.
