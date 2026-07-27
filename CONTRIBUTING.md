# Contributing to Atlas

Atlas is built in the open. Contributions here are real product changes — treat them like you would at any startup you'd want to work at.

## Before you start

1. Read the handbook for your craft in [`docs/`](./docs). It's short and it's how we work.
2. Find an issue labeled [`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or `help wanted`, or open one to propose a change.
3. For anything non-trivial, open an **RFC** first (see [`docs/product/rfc-process.md`](./docs/product/rfc-process.md)) so we align before you build.

## Workflow

```bash
# 1. Fork, then clone your fork
git clone https://github.com/<you>/Atlas-Building.git
cd Atlas-Building && pnpm install

# 2. Branch from main
git checkout -b feat/short-description

# 3. Make your change. Keep it focused.
pnpm lint && pnpm typecheck && pnpm test

# 4. Commit (Conventional Commits) and push
git commit -m "feat(talent): add confidence decay for stale signals"
git push origin feat/short-description
```

Then open a pull request against `main` and fill in the template.

## What a good PR looks like

- **Small and focused.** One concern per PR.
- **Explains the *why*.** We evaluate judgment, not just diffs. Link the issue/RFC.
- **Green checks.** Lint, types, and tests pass.
- **Tests for behavior you changed.** See [`docs/engineering/testing.md`](./docs/engineering/testing.md).
- **No secrets.** Never commit `.env*` or keys.

A maintainer reviews in the open. Merged PRs are public evidence of how you work.

## The guided experience

Learning the ropes? The role-based missions, weekly context, and mentorship live on **[Morrio Universe](https://morrio.ai/universe)** — not in this repo. Do the missions there; contribute the real thing here.

## Code of conduct

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).
