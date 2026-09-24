# Operations — Cost Controls

Atlas spends money per request: every Capability Challenge run, every evidence extraction, every
video transcript goes through a metered model call. Two things can go wrong — spend climbs
faster than expected, or spend runs away. They need two different mechanisms.

## Two knobs, not one

Conflating "tell me" with "stop" produces a bad version of both: an alert you cannot act on, or
a ceiling that trips before you have any idea what normal looks like.

| | Alert threshold | Hard ceiling |
|---|---|---|
| Default | **On** | **Off** |
| Effect | Changes nothing. Sends one message. | Refuses work. |
| Failure if wrong | Noise | Outage |
| Recovery | Edit the number | Edit the number |

Ship the alert on and the ceiling off while you have no data. A ceiling guessed wrong is itself
an outage, and it will happen on the day usage is highest — which is the day you least want the
product to stop.

## When that reasoning inverts

Once a monthly cap exists upstream — at the provider, on the billing account, anywhere you do
not control — leaving the daily ceiling off becomes the riskier choice. A monthly cap with no
daily throttle means one bad day consumes the month, and the upstream service then stays dead
until the month resets. A daily ceiling turns a month-long outage into an hours-long one.

So: no upstream cap, no daily ceiling needed yet. Upstream cap exists, turn the daily ceiling on.

## Where the mechanism lives

- `src/lib/ai/usage.ts` — the ledger and the two checks.
- `src/lib/ai/client.ts` — the wrapped client that consults them. Metering is at the client, not
  at the call site, so a new call site is metered by existing ([ADR-0006](../adr/0006-cost-metered-at-the-client.md)).
- `ATLAS_AI_DAILY_ALERT_USD` and `ATLAS_AI_DAILY_CEILING_USD` — the two numbers.

**The numbers are a business decision; the mechanism is not.** Do not put an organisation's
actual thresholds in this repo — set them per environment and confirm them against the running
deployment, not against the file on your disk (see
[Verification §3](../engineering/verification.md)).

## Reviewing the numbers

Raise the alert threshold when it fires on ordinary days — an alert you have learned to ignore
is worse than no alert. Lower it after any incident where you found out late. Record the change
and the reason with a [decision memo](./decision-memo-template.md); the number is only useful if
the next person can see what it was chosen against.
