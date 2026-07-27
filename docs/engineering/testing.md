# Engineering — Testing

We test behavior, not implementation.

## What to test
- **Always:** the Talent Algorithm and anything users see as a score. Pure functions, exhaustive cases.
- **Usually:** route handlers (happy path + one failure), critical UI logic.
- **Rarely:** trivial glue, generated code, third-party wrappers.

## How
- `vitest` for unit/integration. Co-locate as `*.test.ts`.
- Name tests by behavior: `it("lowers confidence when signals are stale")`.
- Arrange–Act–Assert. One reason to fail per test.
- Prefer real inputs over mocks; mock only at the network boundary.

## Before you push
```bash
pnpm test
pnpm typecheck
```
CI runs the same. A red build blocks merge.
