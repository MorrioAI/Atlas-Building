# Engineering — Git Workflow

- Trunk-based. `main` is always releasable.
- Branch names: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- **Conventional Commits**: `type(scope): summary`, e.g. `fix(talent): correct rounding in display layer`.
- Rebase your branch on `main` before opening a PR; keep history clean.
- Squash-merge PRs. The PR title becomes the changelog entry.
- Never force-push `main`. Never commit secrets — rotate immediately if you do.
