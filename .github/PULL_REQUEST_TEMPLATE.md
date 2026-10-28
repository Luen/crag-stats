## Summary

<!-- What changed and why? -->

## Test plan

- [ ] `pnpm lint`, `pnpm check`, `pnpm test`
- [ ] `pnpm build` (and `pnpm test:e2e` if UI/routing changed)

## Stacked PRs & CodeQL

PRs targeting a **feature branch** (stacked PRs) run CI `check` / `docker` but **not** CodeQL — GitHub default code scanning only analyzes PRs to `main`. That is expected; CodeQL runs when the stack lands on `main`.
