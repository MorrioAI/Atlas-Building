# Data Science — Score Evaluation

Atlas's scores are a measurement instrument pointed at people. This is how we check the
instrument before we trust what it says.

## Start with a baseline
- No model result means anything without the dumb thing it has to beat. Signal count, a
  per-dimension mean, "predict the average" — pick one and report it alongside.
- A model that beats nothing has not been evaluated. It has been run.

## Faithfulness of AI output
- The AI layer assigns a 0–100 per signal. Check that the number follows from the artifact and
  not from its length, polish, or tone.
- Re-score the same artifact with the fields that should not matter changed: author, formatting,
  verbosity. A score that moves is measuring the wrong thing.
- Where a score cites a reason, check the reason is actually in the artifact. A fluent
  justification for a wrong number is worse than a bare number.

## Scorer reliability
- **Test-retest:** the same artifact scored twice should land in the same place. Report the
  spread, not just the mean.
- **Agreement:** where a human and the AI layer both score, report how often they agree and
  where they diverge systematically. Systematic divergence is a finding, not noise.
- An unreliable scorer cannot be fixed by averaging more of it.

## Dimensionality
- Seven dimensions are a claim that there are seven things. Test it: if `ownership` and
  `execution` correlate at 0.95 across real profiles, we are reporting one number twice and
  charging the reader for seven.
- The fix is a conversation, not a quiet reweighting. Changing what a dimension means needs an
  ADR — see [ADR-0002](../adr/0002-talent-algorithm-seven-dimensions.md).

## Predictive validity
- The scores claim to say something about how someone works. That claim is testable against
  outcomes we can observe here: review pass rate, merged contributions, repeat engagement.
- Say what the score does **not** predict, in writing, where a reader will find it. An
  unstated limit gets read as an absence of limits.
