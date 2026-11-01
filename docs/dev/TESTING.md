# Testing and check speed

How the checks are organised, which ones to run for a given change, and the measurements behind those choices (#325). `AGENTS.md` holds the short version of the local-check table.

## Where each check runs

| Check                                | Local (agents)               | PR / push to `main` (`ci.yml`) | Nightly release            |
| ------------------------------------ | ---------------------------- | ------------------------------ | -------------------------- |
| `pnpm lint` (Prettier + ESLint)      | always (cached)              | `check` job (cold)             | yes                        |
| `pnpm check` (svelte-check)          | for any code change          | `check` job                    | yes                        |
| `pnpm test` (Vitest)                 | related or full, see below   | `check` job, full              | yes                        |
| `pnpm build`                         | routes, build, deps, release | `e2e` job                      | yes                        |
| `pnpm test:e2e` (Playwright + axe)   | see below                    | `e2e` job, full                | yes                        |
| Docker image + native/importer smoke | Docker/runtime changes       | `docker` job, amd64 + arm64    | `docker-release.yml` build |
| CodeQL (default setup)               | —                            | PRs targeting `main`           | —                          |

CI always runs everything; only the local fast path is proportionate. A newer push to the same PR cancels the older CI run; runs on `main` always finish.

## Local checks by change type

| Change                                                                                           | Run                                                                                           |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Docs / comments only                                                                             | `pnpm lint`                                                                                   |
| Simple copy, styling or markup in a `.svelte` file (no logic)                                    | `pnpm lint`, `pnpm check`, Svelte autofixer; the one browser spec for that page if one exists |
| Logic in `src/lib` or a route                                                                    | `pnpm lint`, `pnpm check`, `pnpm test:related <changed files>` (or `pnpm test`)               |
| New page/route, e2e fixtures, shared components, theme tokens                                    | all of the above, plus `pnpm build` and `pnpm test:e2e`                                       |
| Auth/CSRF, private notes, sync/pruning, migrations, grades, dates/time zones, build/Docker, deps | `pnpm lint`, `pnpm check`, full `pnpm test`, `pnpm build`, `pnpm test:e2e`                    |

When unsure, use the stricter row. Fast-path commands:

```bash
pnpm lint                                   # cached; ~5 s warm vs ~60–80 s cold
pnpm test:related src/lib/soloKind.ts       # tests that import the given files (37 of 96 files here)
pnpm test:changed                           # tests affected by changes vs origin/main
pnpm build && pnpm exec playwright test e2e/soloCards.spec.ts   # one browser spec
```

`pnpm test:changed` falls back to the whole suite when Vitest can't tell what is affected (for example a `package.json` or config change), so it is safe to use as a default. The lint caches live in `node_modules/.cache` and are keyed on file content. ESLint's type-aware Svelte rule can, in principle, keep a stale result for an unchanged file whose imports changed. CI is always cold, so delete `node_modules/.cache` locally if a result looks wrong.

## Measurements

### Baseline (before #325)

GitHub `ubuntu-latest`, three recent green `CI` runs (41297934867, 41159082859, 41159079263):

| Step                              | Time      |
| --------------------------------- | --------- |
| Lint (Prettier + ESLint)          | 16–23 s   |
| `pnpm check`                      | 8–12 s    |
| Unit tests                        | 13–19 s   |
| `pnpm build`                      | 6–7 s     |
| Install Playwright Chromium       | 13–17 s   |
| E2E (81 tests, serial)            | 109–147 s |
| **`check` job total**             | 180–242 s |
| `docker (amd64)` job              | 67–131 s  |
| `docker (arm64)` job (QEMU build) | 179–234 s |

Local, Apple silicon, 8 cores. The machine was shared with other agents, so the load average swung between 7 and 100 and single numbers are noisy. Ranges are from repeated runs:

| Command                           | Cold      | Warm (cached) |
| --------------------------------- | --------- | ------------- |
| `prettier --check .`              | 17–29 s   | ~5 s          |
| `eslint .`                        | 57–65 s   | ~5.5 s        |
| `pnpm check`                      | ~46 s     | —             |
| `pnpm test` (96 files, 663 tests) | 14–69 s   | —             |
| `pnpm test:e2e` (81 tests)        | 2.7–4.4 m | —             |

ESLint time is almost all type-aware parsing of `.svelte` files (`projectService`); rules account for ~13 s, 60% of which is `svelte/require-store-reactive-access`.

### After

E2E, same build and similar machine load, run back to back: 81 tests in 2.7 min (159.8 s summed) → 71 tests in 2.6 min (151.4 s summed). Per spec: weather drill-downs −5.0 s, solo cards −3.0 s, world map −2.6 s, sun-facing badge −2.2 s, weather locations −2.1 s. The saving is small because the axe scans themselves dominate, and every scanned state is kept.

CI timings after this change: see the PR for #325.

### Investigated and not changed

- **Vitest `pool: 'threads'` vs the default `forks`:** alternating runs gave forks 14–20 s and threads 17–24 s. No consistent win, so the default stays.
- **Vitest `isolate: false`:** Vitest suggests it would save ~8–9 s, but each test file relies on a fresh module graph for its own `:memory:` SQLite (#57). Not changed.
- **`eslint --concurrency auto`:** no gain (63 s), because the TypeScript project service is shared.
- **Playwright workers / sharding:** tests share three mutable seeded databases and run serially by design. Parallel workers would race. Sharding across CI runners would give each shard its own servers and DB, but files are not proven independent of each other's leftover state, and the `docker (arm64)` job already sets PR wall time. Revisit if e2e outgrows the Docker job.
- **pnpm store cache:** `pnpm install` takes under 5 s on CI already.

## Consolidated tests (#325)

No test was deleted and no assertion dropped. Seven feature specs ran their entire flow (seeding, navigation, filters, keyboard checks) once per theme just to scan dark mode. Navigation behaviour does not depend on the theme, so each flow now runs once and calls `expectAxeClean()` (`e2e/axe.ts`) at the same states. It scans light and dark in place, keeping open details, pressed toggles and the viewport.

| Spec                           | Before                   | After                       | Still covered                                                                            |
| ------------------------------ | ------------------------ | --------------------------- | ---------------------------------------------------------------------------------------- |
| `weather.spec.ts`              | 2 tests (light, dark)    | 1 test, 5 dual-theme scans  | calendar values table, dashboard, filtered logbook, sectors climate, fair-weather metric |
| `weather-drilldowns.spec.ts`   | 2                        | 1, 2 dual-theme scans       | filtered logbook page, conditions card rows                                              |
| `soloCards.spec.ts`            | 2                        | 1, scans at 1440 and 390 px | full-card links, keyboard, pagination/filter persistence                                 |
| `sunFacingBadge.spec.ts`       | 8 (4 evidence cases × 2) | 4                           | each evidence case, badge page in both themes                                            |
| `trainingLoadContrast.spec.ts` | 2                        | 1                           | Spike pill and multi-digit sidebar counts in both themes                                 |
| `worldMap.spec.ts`             | 2                        | 1, scans at 1440 and 390 px | dateline markers, controls, values table links                                           |
| `weatherLocations.spec.ts`     | 2                        | 1                           | settings page with the area details open, fallback search/selection/removal              |

`a11y.spec.ts` is unchanged: it is the representative full-page audit of the main pages in each theme, loaded fresh with `test.use({ colorScheme })`.

**Does the in-place dark scan still catch dark-only regressions?** Verified by mutation: setting the dark `--ink-muted` token to the dark line colour and rebuilding made `soloCards.spec.ts` fail with 243 `color-contrast` violations in the dark theme only; the light scan passed. The token was then restored.

## When a new test adds value

- **Logic** (grades, analytics, sync, filters, dates): a focused Vitest test next to the module. Use synthetic data and the per-file `:memory:` DB.
- **Browser** tests are for user-visible flows or states a unit test can't reach: populated badges, pills, weather states, keyboard and focus, auth gates, layout at mobile width. Extend the nearest existing spec rather than adding a new one with its own seeding.
- **Accessibility:** call `expectAxeClean(page, { include })` at the new state. Don't wrap a flow in a light/dark loop, and don't add another full-page scan of a page that `a11y.spec.ts` already audits in the same state.
- **Skip** tests that mirror the implementation, assert incidental markup or class names, or re-check behaviour already covered at the same layer. A trivial, reversible copy or styling change usually needs no new test.
- **Never** skip tests, raise retries or loosen isolation to make checks faster.
