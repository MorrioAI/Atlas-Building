# Data Engineering — Write Discipline

The rules that make a pipeline safe to run twice, which is the only kind of pipeline that
survives contact with a retry.

## Idempotent writes
- Every write is keyed and repeatable: running the same load twice produces the same table, not
  double the rows. Use a natural key and `on conflict do update`, not read-then-write from the
  job.
- A counter can usually afford to be approximate. Anything a user sees as a score, or anything
  that gates money, cannot — and the moment it matters is the moment several jobs are in flight.
  The spend ledger is the worked example:
  [ADR-0006](../adr/0006-cost-metered-at-the-client.md).
- Prefer incremental loads with an explicit watermark over full rebuilds, and make the watermark
  a stored value rather than "yesterday". A pipeline that computes its own window from the clock
  gets it wrong exactly once, on the day nobody is watching.

## Versioned writes
- Rows carry the schema version and the version of the logic that produced them. A scorer change
  must be distinguishable in the data from a change in the people being scored — otherwise every
  trend line is uninterpretable after the first release.
- Never rewrite history in place to match new logic. Write the new version alongside and let
  readers choose. In-place correction is how a metric quietly changes meaning.

## Data contracts
- A table other code reads is an interface. Document its columns, their types, and what is
  guaranteed about them — nullability and uniqueness especially.
- Breaking a contract is a breaking change: additive first, migrate readers, then remove. The
  same discipline as an API, for the same reason.
- Validate at the boundary. A pipeline that accepts a malformed upstream row and writes it
  through has moved the bug somewhere harder to find.

## Tenant isolation
- Institution data is separated at the row level and enforced in the database, not in a `where`
  clause somebody has to remember. RLS is the mechanism; a forgotten filter in application code
  is the failure it prevents.
- Test isolation with a fixture that has two tenants and asserts one cannot read the other.
  A test with a single tenant passes whether isolation works or not — see
  [Verification §2](../engineering/verification.md).
