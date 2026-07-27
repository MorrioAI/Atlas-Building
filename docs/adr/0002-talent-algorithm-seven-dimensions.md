# ADR-0002: The Talent Algorithm scores seven dimensions

**Status:** Accepted

## Context
Employers don't hire "a 9/10 person." They hire for specific capabilities. A single score hides the signal.

## Decision
The Talent Algorithm scores seven dimensions, each with a **score** and a **confidence**:
`technical_depth`, `communication`, `leadership`, `ownership`, `collaboration`, `learning_ability`, `execution`.

Every dimension score links to the evidence that produced it. Low-confidence dimensions are shown as such, never as false precision.

## Consequences
More to compute and display, but honest and useful. See `src/lib/talent`.
