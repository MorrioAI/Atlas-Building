# Data Science — Uncertainty and Fairness

What we owe the person being scored. Both rules below exist because a score about someone can
follow them around.

## State uncertainty
- Every reported score carries its confidence. Confidence is displayed, never hidden — a score
  from two signals must not render like a score from twenty. This is a product invariant, not a
  preference (see [ADR-0003](../adr/0003-evidence-over-claims.md)).
- Report the interval, not only the point estimate. Small n gets said out loud, in the same
  sentence, not in a footnote.
- Scores keep one decimal. Rounding to integers reads as more precision than we have, which is
  the opposite of the intent.
- "We don't know yet" is a valid result and a publishable one. Filling a gap with a confident
  number is the failure this whole section guards against.

## Fairness
- Before shipping a scorer change, compare its output across groups you can measure without
  collecting anything new — contributor tenure, first language of the submission, artifact
  length, time zone. A gap is a question to answer, not a result to ship.
- Check the **input** as well as the output. If evidence only comes from surfaces one kind of
  contributor uses, the scorer inherits that and will look fair on its own test set.
- Never add a protected or inferred-protected attribute as a model feature. Measuring a gap
  requires knowing the groups; predicting with them does not follow from that.
- An unexplained disparity blocks release the same way a scoring bug does. Both are trust bugs.

## Writing it down
- Analysis that informs a scorer change belongs in the PR that makes the change, with the
  question stated before the data was pulled.
- Observational findings get labelled observational. If nothing was randomised or held out, the
  write-up says so in the first line.
