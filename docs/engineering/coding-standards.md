# Engineering — Coding Standards

We optimize for the next person to read the code, not the fastest way to write it.

## TypeScript
- `strict` is on, plus `noUncheckedIndexedAccess`. No `any` — use `unknown` and narrow.
- Prefer types at boundaries (API, DB rows, props). Let inference do the rest inside functions.
- No default exports for shared modules — named exports are greppable and refactor-safe.

## React
- Function components + hooks. Keep components small; extract when a file passes ~200 lines.
- Data fetching in Server Components / route handlers; keep client components lean.
- Derive state; don't duplicate it. Avoid `useEffect` for things you can compute in render.

## Structure
- Route handlers are thin. Business logic lives in `src/lib/*` as pure, testable functions.
- One concern per file. Co-locate tests as `*.test.ts` next to the code.

## Naming
- `camelCase` for values, `PascalCase` for types/components, `SCREAMING_SNAKE` for constants.
- Booleans read as questions: `isPublic`, `hasSignal`, `canSubmit`.

## Comments
- Comment the **why**, never the **what**. If the "what" needs a comment, rename things instead.
- Leave a `// NOTE:` for non-obvious constraints and a `// TODO(owner):` with a name.

## Errors
- Fail loud on trust-critical paths (scoring, auth, billing). Fail open only where a degraded UX beats an error.
- Never swallow errors silently. Log with context or rethrow.

## Formatting
- Prettier + ESLint decide style. Don't hand-format; run `pnpm lint`.
