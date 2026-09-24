# ADR-0006: Cost is metered at the client, not at the call site

**Status:** Accepted

## Context
Atlas spends money per model call, and those calls will end up spread across scoring, challenge
evaluation, transcript extraction and whatever ships next. Metering them at the call site works
once and then rots: the twenty-eighth call site forgets, and nobody notices, because the
symptom of forgetting is silence.

Do this while the repo has a handful of call sites. Wrapping a client early is cheap; retrofitting
every call site later is not.

## Decision
We wrap the Anthropic client once, in `src/lib/ai/client.ts`, and export the wrapper. Call sites
do not change and do not opt in.

```ts
const rawCreate = client.messages.create.bind(client.messages)
client.messages.create = (async (...args) => {
  await assertUnderCap()          // refuse before spending
  const result = await rawCreate(...args)
  void record(result.usage)       // never awaited on the request path
  return result
}) as typeof client.messages.create
```

Four rules make this work rather than merely look tidy:

- **Cover the streaming path.** `messages.stream` returns a stream, not a result; the wrapper
  hooks its final-message event. One unhooked method is a silent hole in the accounting, and a
  hole in accounting looks exactly like an absence of spend.
- **Recording is fire-and-forget and must never throw.** A missing table or a database blip
  degrades to "we don't know what today cost" — never to a failed request. Prove it by running
  the real path with the table absent (see
  [Verification §2](../engineering/verification.md)).
- **The ledger is incremented by the database.** One row per `(day, scope)`, written by a
  function using `ON CONFLICT DO UPDATE`, not read-then-write from the app. A spam counter can
  afford to undercount under concurrency. A spend ceiling cannot, and the one moment it matters
  is the moment many calls are in flight.
- **Attribution is a label, never an authorisation.** The wrapper sits below every route and has
  no user argument, so it reads the session cookie to label the cost row. That is enough to
  answer "who spent this". It is **not** enough to decide what someone may do. The comment saying
  so lives at the top of the file, so that nobody later promotes it to an access check.

Alert and ceiling are two separate knobs — see [Cost Controls](../operations/cost-controls.md).

## Consequences
New call sites are metered by existing. Nobody has to remember.

The cost is a monkey-patched client, which is surprising the first time you read it. It is
confined to one file and commented there. The alternative — a hand-rolled facade over the SDK —
drifts from the SDK's own surface every time it changes, and the drift is silent too.

The wrapper cannot see the model call's *purpose*, only its scope. If we later need per-feature
cost attribution, that is a parameter threaded deliberately, not another cookie read.
