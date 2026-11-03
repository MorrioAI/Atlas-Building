# Data Engineering — Event Schema

Every score in Atlas points back to an artifact, so the data the evidence lives in is part of
the product's honesty, not plumbing underneath it.

## Naming
- Event names follow the rule already set in
  [Metrics Standards](../data/metrics-standards.md#event-naming): `object_action`, past tense,
  `snake_case`. One rule, one place — if you want to change it, change it there.
- Properties are typed and documented. No free-form blob columns: a blob is a schema nobody
  agreed to and nobody can query.
- Name the thing that happened, not the feature that happened to emit it. `challenge_completed`
  survives a rewrite of the Challenge UI; `challenge_v2_modal_done` does not.

## What an event must carry
- A stable id for the subject, a UTC timestamp, and the id of the artifact it refers to. A
  signal that cannot name its artifact cannot back a score (ADR-0003).
- The schema version. See [Write Discipline](./write-discipline.md).
- Nothing it does not need. An event is the easiest place to accumulate personal data by
  accident, because nobody reads an event schema looking for it.

## Session capture
- Capture sessions as append-only facts — start, end, and the events between — not as a mutable
  row updated in place. The mutable version loses the one thing a session is for: what happened
  in what order.
- A session that ends by the client disappearing is the normal case, not an error. Close it on a
  timeout rule you have written down, and record that the close was inferred rather than
  observed. Inferred and observed ends must stay distinguishable downstream.

## Lineage
- Every derived table records where its rows came from and which run produced them. "This score
  is 72" is not a claim we can defend if we cannot say which pipeline run computed it.
- Lineage is how a bad scorer release gets unwound. Without it, correcting a scoring bug means
  recomputing everything and hoping.
