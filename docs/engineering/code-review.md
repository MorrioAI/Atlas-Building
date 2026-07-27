# Engineering — Code Review

Review is how we teach and how we keep trust in the product.

## As the author
- Keep PRs small and single-purpose. A 200-line PR gets a real review; a 2,000-line one gets a rubber stamp.
- Write the "why" in the description. Link the issue/RFC.
- Review your own diff first. Leave comments on the tricky parts before a human does.

## As the reviewer
- Respond within one working day. A fast "I'll look tomorrow" beats silence.
- Evaluate **judgment**: is this the right change, not just a correct one?
- Distinguish blocking from non-blocking. Prefix nits with `nit:`.
- Approve when it's better than `main`, not when it's perfect. Ship and iterate.

## Bar for merge
- Green CI, tests for changed behavior, no known regressions.
- Trust-critical code (talent, auth, billing) needs a second approval — see CODEOWNERS.
