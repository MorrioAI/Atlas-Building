# Engineering — Verification

How you know what you think you know. Three failure modes, each cheap to avoid once named.

## 1. Absence of a search hit is not absence of the thing

`grep` finds one spelling of one helper. It does not find the capability.

A rate limit looks missing when it is applied by a different wrapper. Prompt caching looks
missing when it goes through a different helper. The danger is not the bad search — it is that
the conclusion ("we don't do this") lands in a document and is then read as the truth by
everyone who comes after.

**A claim about behaviour is settled by observing behaviour.** Read the code path end to end,
or better, measure it. Whether responses are cached is answered by reading the token counts
off a live response, not by finding the call that sets the flag.

If you write "X is not implemented", say how you checked. A search is a lead. A
request-and-response is evidence.

## 2. Reproduce the problem before you write the fix

A fix can be specified, reviewed and approved for a condition that cannot occur.

The shape: a guardrail note asserts that unverified accounts can consume paid resources. A
check is designed to stop them. Thirty seconds of actually signing up shows that no session is
issued until the address is confirmed — the account the note describes cannot exist. The fix
would have been a branch that never runs: dead code carrying the authority of a merged PR.

Two corollaries:

**Negative assertions mean nothing until the positive ones pass.** An early draft of a media
route can return 404 for *every* request. Every "a private item is refused" test passes, for
entirely the wrong reason. A suite that only asserts refusals is indistinguishable from a
feature that is switched off. Assert the 200 first, in the same file, directly above the 404 —
`src/app/api/media/video/[...key]/route.test.ts` carries that warning at the top.

**When the harness disagrees with the code, suspect the harness.** A failing assertion is often
a fixture that does not match how the system actually writes the row. Check the test before you
change the system.

## 3. Verify the deployment, not the file on your disk

A value in your local `.env` proves nothing about what is running. On most platforms an
environment variable only takes effect on the next deployment, so "I set it and redeployed" is
a belief, and it is not checkable from outside.

The fix is small: an authenticated admin endpoint that reports the configuration **it** sees —
names and presence, never values — and a short script that asks the running servers. One round
trip turns the belief into a fact.

This generalises to anything environment-scoped: feature flags, model IDs, limits, ceilings.
Ask the running system what it thinks it is configured with.
