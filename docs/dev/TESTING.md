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

## Disposable browser databases

Every Playwright invocation starts each server through `scripts/e2e-server.mjs <open|settings|all>`. Before importing the normal production server entry, it resets only that server’s SQLite file and its `-wal` / `-shm` sidecars under `e2e/.tmp`. This happens once per server startup, before migrations and sample seeding, so an interrupted previous run cannot leave conflicting fixture IDs or old settings. The wrapper pins `DATABASE_PATH` to that disposable location; linked directories are rejected.

Do not delete databases from config evaluation (workers reload it) or the setup project (servers already have SQLite open). The reset preserves other files, screenshots and traces. Tests still need `finally` cleanup because tests and retries within one invocation share those running servers. Concurrent suites in the same checkout/ports remain unsupported.

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

### After the CI split (#340, #343): medians of 7 runs

Single CI runs vary by 35% or more, so budgets come from medians. These are all seven green `CI` runs with the split `check` / `e2e` layout (41301051083, 41301350665, 41302294748, 41302304766, 41303199072, 41303492168, 41304060780; 1 November 2026):

| Job / step                    | Median | Range     |
| ----------------------------- | ------ | --------- |
| `check` job                   | 66 s   | 53–75 s   |
| ↳ Lint (Prettier + ESLint)    | 17 s   | 14–23 s   |
| ↳ `pnpm check`                | 9 s    | 7–11 s    |
| ↳ Unit tests                  | 17 s   | 12–21 s   |
| `e2e` job                     | 196 s  | 142–213 s |
| ↳ E2E step (Playwright + axe) | 161 s  | 109–167 s |
| `docker (amd64)` job          | 73 s   | 57–91 s   |
| `docker (arm64)` job (QEMU)   | 195 s  | 150–241 s |

The split made lint, type and unit failures report in about a minute instead of after the browser suite. It did not shorten the browser path: the E2E step grew from 109–147 s, partly because new specs merged the same day (about +25 s) and partly because a dual-theme scan costs about as much as two single-theme flows on CI. `docker (arm64)` sets PR wall time.

### Budget

Checked against the median of at least five green CI runs (not a single run). The first targets were set from the seven-run medians above. They were re-based in November 2026 from the 16 runs after #370 (below), because the first targets could only be met on GitHub's faster runners.

| Stage                | Budget  | Median (16 runs after #370) | First target |
| -------------------- | ------- | --------------------------- | ------------ |
| `check` job          | ≤ 85 s  | 75.5 s                      | ≤ 75 s       |
| E2E step (`e2e` job) | ≤ 170 s | 152.5 s                     | ≤ 120 s      |
| Unit tests (CI step) | ≤ 25 s  | 22 s                        | ≤ 20 s       |

Each budget sits just above the slowest run in that baseline, so a median over budget means the suite really got slower, not that a run landed on a slow runner.

To re-measure, list green runs with `gh run list --workflow ci.yml --status success` and read job and step times from `gh api repos/Luen/crag-stats/actions/runs/<id>/jobs`. When a stage goes over budget, find the cause before adding hardware or retries: usually a new full-page scan or a new spec that seeds its own data.

### After scoped scans (#346): first CI runs

Only three green `CI` runs include #346 so far, so these are not yet medians. The suite also grew from 71 to 78 browser tests on the day #346 merged (offline mode, weather & performance, partner context, weather area checks).

| Run                           | Browser tests | `check` job | ↳ Unit tests | E2E step | Summed test time | `e2e` job | `docker (arm64)` |
| ----------------------------- | ------------- | ----------- | ------------ | -------- | ---------------- | --------- | ---------------- |
| 41353946109 (#346 PR)         | 71            | 50 s        | 13 s         | 133 s    | 126 s            | 169 s     | 178 s            |
| 41384634197 (main, 13 merges) | 78            | 79 s        | 24 s         | 160 s    | 153 s            | 198 s     | 185 s            |
| 41385717024 (#369)            | 78            | 76 s        | 23 s         | 157 s    | 151 s            | 197 s     | 204 s            |

The E2E step is still above its ≤ 120 s budget, and the `e2e` job now takes about as long as `docker (arm64)`. On main, `a11y.spec` (28 s, the intended full-page audit), `soloCards` (12 s), `weather` (11 s), `weather-drilldowns` (10 s) and `seasonality` (8 s) are the largest specs. Two specs still scanned far more than they changed: `soloCards` scanned the whole dashboard at two widths and `partnerContext` the whole `/badges` page and dashboard. Scoping them to their cards cut them locally from 10.5–14.2 s to 5.9–6.9 s and from 6.4–7.1 s to 3.9–5.3 s (two runs each). A mutation check (dark `--ink-muted` set to the dark line colour) still failed both specs in the dark theme only.

The `check` job and unit step were also above budget in the two latest runs, while the #346 run was well under. Lint took 24–25 s in those runs against 15 s in the #346 run with the same lint config, so runner variance is likely; confirm with five runs before acting.

### After #370: medians of 16 runs

All 16 green `CI` runs from #370's merge through `af461c5` (2–3 November 2026; 8 on `main`, 8 on PRs). The browser suite was 78 tests in most runs and 83 in the latest three.

| Job / step                    | Median  | Range     |
| ----------------------------- | ------- | --------- |
| `check` job                   | 75.5 s  | 50–81 s   |
| ↳ Lint (Prettier + ESLint)    | 24 s    | 15–26 s   |
| ↳ Unit tests                  | 22 s    | 13–24 s   |
| `e2e` job                     | 187 s   | 127–337 s |
| ↳ E2E step (Playwright + axe) | 152.5 s | 98–166 s  |
| `docker (arm64)` job (QEMU)   | 169 s   | 55–243 s  |

Runs (`gh run view <id>`): 41387218723, 41387282448, 41388543206, 41389619390, 41389841234, 41389874535, 41390162845, 41390778225, 41391053371, 41391073045, 41395771265, 41398653306, 41400106649, 41401170157, 41549347872, 41549367302.

**Runner speed, not the suite, splits the E2E step into two groups.** Six runs took 98–121 s and ten took 150–166 s, with no values in between. Within the 78-test runs, the same runner image (`ubuntu-26.04` 20261021.618) finished Playwright in 1.6–1.7 min on the fast group and 2.5–2.6 min on the slow one. Two `main` runs started a minute apart, where the second commit only bumped the version, took 102 s (`2108c9b`) and 154 s (`9ea630f`). The `check` job splits the same way (50–64 s vs 70–81 s). That is why the first ≤ 120 s E2E target was met only on fast runners. It is also why budgets are re-based above the slow group, not tightened further by trimming tests.

**Compared with the baseline:** lint, type and unit failures now report at a median of 75.5 s, against a single 180–242 s job that ran the browser suite first. The browser step itself is about where it was (109–147 s for 81 tests then; 98–166 s for 78–83 tests now). It now runs each flow once with scoped dual-theme scans, and covers features added since. The `e2e` job median (187 s) is now above `docker (arm64)` (169 s), so the browser suite sets PR wall time. Sharding is tracked separately (see below).

### Scoped axe scans

Most feature scans audited the whole page, re-checking the header, sidebar and every dashboard card that `a11y.spec.ts` already audits in both themes. Full-page dashboard scans were the slowest steps in the suite. Feature specs now pass `include` for the region the feature changed. `expectAxeClean()` accepts CSS selectors or Playwright locators (for example one dashboard card). Six specs that still repeated their whole flow per theme now run once and use the helper.

| Spec                                                         | Scope                                                                                          | Why                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `a11y.spec.ts`                                               | full page, fresh load per theme                                                                | the representative audit of shared chrome and main pages   |
| `trainingLoadContrast.spec.ts`                               | **full page**                                                                                  | the regression is the sidebar count badges (shared chrome) |
| `weather.spec.ts`                                            | Weather conditions, Ascent calendar and Recent activities cards; `main` on logbook and sectors | the weather surfaces the spec populates                    |
| `weather-drilldowns.spec.ts`                                 | `main` (filtered logbook); `.shares`, `.whole-row`                                             | logbook filters and card rows                              |
| `weatherLocations.spec.ts`                                   | `main`                                                                                         | settings subpage with the area details open                |
| `sunFacingBadge.spec.ts`                                     | the Summer Sun Face badge card                                                                 | the evidence and link on that card                         |
| `firstAscents.spec.ts`                                       | the First ascents card                                                                         | setter-only card layout (#150)                             |
| `cardPreferences.spec.ts`                                    | `main`; one flow (was one per theme)                                                           | migrated card toggles                                      |
| `partnerMetrics.spec.ts`                                     | `article.compact`; one flow (was one per theme)                                                | the dashboard Partners card                                |
| `projects.spec.ts`                                           | `main` at 1440 and 390 px; one flow (was one per theme)                                        | project cards                                              |
| `ropeSoloBadges.spec.ts`                                     | `main` at 1440 and 390 px; one flow (was one per theme)                                        | badge cards                                                |
| `routeHistory.spec.ts`                                       | `main`; one cooldown flow (was one per theme)                                                  | the Settings countdown button and status                   |
| `soloCards.spec.ts`                                          | the Solo climbing card at 1440 and 390 px (was all of `main` on the dashboard)                 | the solo card and its links                                |
| `partnerContext.spec.ts`                                     | the Crowded Belay badge card; the Hardest sends, Notable ascents and Recent activities cards   | companion text wrapping on those cards (#349)              |
| `weatherPerformance.spec.ts`                                 | the Weather & performance card                                                                 | the card's bands, toggles and values table                 |
| `offline.spec.ts`                                            | `main` on `/offline`                                                                           | the offline viewer is the whole page                       |
| others (`seasonality`, `worldMap`, `streaks`, `syncSummary`) | already scoped                                                                                 | —                                                          |

Local, same build, back to back (Apple silicon, quiet machine): 76 tests in 2.6 min (148.0 s summed) → 71 tests in 2.0 min (114.9 s summed), −22%. The largest drops: `weather.spec` 18.5 → 5.3 s, `sunFacingBadge` 10.5 → 3.2 s, `weather-drilldowns` 10.1 → 5.0 s, `firstAscents` 7.1 → 3.5 s. This is one paired local run; confirm against the CI budget with medians once a few runs have landed.

### Unit test audit

`pnpm test` on a quiet machine: 101 files, 683 tests, about 6 s wall. Vitest reports import as 56–59% of summed worker time.

- **Critical path.** Files run in parallel, so wall time is roughly the slowest file. `routeHistoryEngine.test.ts` takes about 4.6 s of test time on its own (24 tests at 150–210 ms). It is real SQLite work: each test seeds 105 routes (about 40 ms via `upsertAscents`) and runs 100-route imports. The pacing sleeps are already faked. The 105-route fixture is what proves the 100-route cap, so it stays. Splitting the file only to parallelise it was not done.
- **Import graph.** 13 test files imported all of `analytics.ts` only for `wipeAllData`. It now lives in `src/lib/server/wipe.ts` (re-exported from `analytics.ts`), and those tests import it directly. Measured over three runs each: 6.2–6.4 s → 5.8–5.9 s wall.
- **Duplicates.** `dashboardExtras.test.ts` repeated the two `splitPartners` cases from `partnerStats.test.ts` word for word. `dashboardExtras` only re-exports the `partnerStats` function, so the copy was removed. The other repeated test names (`rejects missing or invalid dates` in `projects.test.ts`) cover different functions and stay.
- **Kept:** per-file `:memory:` isolation (#57); `isolate: false` and a pool change were measured and rejected (below).

### Investigated and not changed

- **Vitest `pool: 'threads'` vs the default `forks`:** alternating runs gave forks 14–20 s and threads 17–24 s. No consistent win, so the default stays.
- **Vitest `isolate: false`:** Vitest suggests it would save ~8–9 s, but each test file relies on a fresh module graph for its own `:memory:` SQLite (#57). Not changed.
- **`eslint --concurrency auto`:** no gain (63 s), because the TypeScript project service is shared.
- **Playwright workers / sharding:** tests share three mutable seeded databases and run serially by design. Parallel workers would race. Sharding across CI runners would give each shard its own servers and DB, but files are not yet proven independent of each other's leftover state. After #370 the `e2e` job (median 187 s) overtook `docker (arm64)` (169 s), so sharding would now shorten PR wall time. It is tracked in #378, which first requires each spec file to pass on its own (#366 resets the databases per invocation, which makes that check possible).
- **pnpm store cache:** `pnpm install` takes under 5 s on CI already.

## Consolidated tests (#325)

No test was deleted and no assertion dropped. Ten feature specs (seven in #340, three more added later the same day) ran their entire flow (seeding, navigation, filters, keyboard checks) once per theme just to scan dark mode. Navigation behaviour does not depend on the theme, so each flow now runs once and calls `expectAxeClean()` (`e2e/axe.ts`) at the same states. It scans light and dark in place, keeping open details, pressed toggles and the viewport.

| Spec                           | Before                   | After                       | Still covered                                                                            |
| ------------------------------ | ------------------------ | --------------------------- | ---------------------------------------------------------------------------------------- |
| `weather.spec.ts`              | 2 tests (light, dark)    | 1 test, 5 dual-theme scans  | calendar values table, dashboard, filtered logbook, sectors climate, fair-weather metric |
| `weather-drilldowns.spec.ts`   | 2                        | 1, 2 dual-theme scans       | filtered logbook page, conditions card rows                                              |
| `soloCards.spec.ts`            | 2                        | 1, scans at 1440 and 390 px | full-card links, keyboard, pagination/filter persistence                                 |
| `sunFacingBadge.spec.ts`       | 8 (4 evidence cases × 2) | 4                           | each evidence case, badge page in both themes                                            |
| `trainingLoadContrast.spec.ts` | 2                        | 1                           | Spike pill and multi-digit sidebar counts in both themes                                 |
| `worldMap.spec.ts`             | 2                        | 1, scans at 1440 and 390 px | dateline markers, controls, values table links                                           |
| `weatherLocations.spec.ts`     | 2                        | 1                           | settings page with the area details open, fallback search/selection/removal              |
| `seasonality.spec.ts`          | 2                        | 1, scans at 1440 and 390 px | search, month/scope URLs, exact-route logbook links, private-note exclusion              |
| `streaks.spec.ts`              | 2                        | 1                           | record date range at mobile width, streak badges                                         |
| `syncSummary.spec.ts`          | 2                        | 1                           | CSV import summary counts on first and repeat upload                                     |

`a11y.spec.ts` is unchanged: it is the representative full-page audit of the main pages in each theme, loaded fresh with `test.use({ colorScheme })`.

**Does the in-place dark scan still catch dark-only regressions?** Verified by mutation: setting the dark `--ink-muted` token to the dark line colour and rebuilding made `soloCards.spec.ts` fail with 243 `color-contrast` violations in the dark theme only; the light scan passed. The token was then restored.

## When a new test adds value

- **Logic** (grades, analytics, sync, filters, dates): a focused Vitest test next to the module. Use synthetic data and the per-file `:memory:` DB.
- **Browser** tests are for user-visible flows or states a unit test can't reach: populated badges, pills, weather states, keyboard and focus, auth gates, layout at mobile width. Extend the nearest existing spec rather than adding a new one with its own seeding.
- **Accessibility:** call `expectAxeClean(page, { include })` at the new state, scoped to the region the feature changed (a selector or a locator). Don't wrap a flow in a light/dark loop, and scan the whole page only when the regression is in shared chrome; record that choice in the scoped-scan table above.
- **Skip** tests that mirror the implementation, assert incidental markup or class names, or re-check behaviour already covered at the same layer. A trivial, reversible copy or styling change usually needs no new test.
- **Never** skip tests, raise retries or loosen isolation to make checks faster.
