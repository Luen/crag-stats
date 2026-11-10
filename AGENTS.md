# AGENTS.md — Crag Stats

> **Living document.** Future AI agents (and humans) should read this before changing the repo, and **update it** when they learn something new, correct a mistake, or retire outdated guidance. Prefer short, actionable notes over essays. Remove stale info rather than commenting it out.

Self-hosted climbing analytics for [theCrag](https://www.thecrag.com/), inspired by [Dreeve](https://dreeve.app/) (Stats for Strava) and [RoxClimbs](https://roxclimbs.com/). AGPL-3.0 licensed.

---

## Product principles

1. **Upstream is source of truth.** Like Dreeve ↔ Strava: theCrag owns the logbook. Local SQLite is a cache + analytics store.
   - API sync **upserts** creates/updates (comments, grades, ticks, heights, etc.).
   - API sync **deletes** local ascents that no longer exist upstream, then orphans routes/projects.
   - Do **not** invent a second editable logbook that drifts from theCrag.
   - **All automated access to theCrag goes through its API** (theCrag terms; they asked us to remove automated CSV export downloads, which were also costly full exports). Owners without a supporter key upload the CSV export by hand in Settings; manual uploads upsert only and never prune. Never reintroduce scheduled/automated website logins, exports, or downloads.
2. **Privacy.** API keys expose private notes. Never commit `.env`. Wipe must remain available in Settings.
   - Ascent notes (`ascents.comment`) are private and hidden by default. They reach a page only via `listLogbook({ includeNotes })` when `notesVisible(getShowNotes().enabled, locals.authed)` (`src/lib/server/notes.ts`; Settings toggle only, off when unset). When hidden they're nulled before filtering, so search can't probe them. Never put notes in dashboard stats, embeds, OG text or anything else visitors can load.
   - `APP_PASSWORD` + `AUTH_SCOPE=settings|all` gate admin (or whole UI). Login is rate-limited in-process (5 fails / 15 min + min gap).
   - Prefer Cloudflare Access on `/settings*` + `/login*` in front of public tunnels; app password remains a second factor.
   - Open redirects are blocked via `safeRedirectPath`; passwords compared via HMAC digests (timing-safe).
3. **Provider-shaped.** Core types live under `src/lib/server/providers/`. theCrag is first; Mountain Project later. Keep canonical ascent/route shapes provider-agnostic.
4. **Grade honesty.** Never mix grading systems in one pyramid row list. Split by climb style and/or convert into the user’s preferred system.

---

## Stack & tooling

| Piece           | Choice                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------- |
| App             | SvelteKit 3 + Svelte 5 (runes: `$props`, `$derived`, `$state`)                            |
| CSS             | Tailwind 4 where useful + theme tokens in `src/app.css` (light/dark)                      |
| Font            | Plus Jakarta Sans (bundled via `@fontsource-variable/plus-jakarta-sans`, no CDN)          |
| DB              | SQLite via `better-sqlite3` + Drizzle ORM                                                 |
| Package manager | **pnpm** (pin via `package.json#packageManager`; config in `pnpm-workspace.yaml`)         |
| Node            | 26 LTS+                                                                                   |
| Deploy          | Docker multi-arch → GHCR (`ghcr.io/luen/crag-stats`)                                      |
| Migrations      | Versioned SQL in `/migrations`, run on container boot via `scripts/docker-entrypoint.mjs` |
| i18n            | Planned (Crowdin epic/issue) — not implemented yet                                        |

**Import alias:** `#lib/...` → `src/lib/...` (see `svelte.config` / `tsconfig` paths).

**Env:** Kit 3 private env via `src/env.ts` / `#lib/server/env` (`defineEnvVars`). Do not assume `process.env.THECRAG_API_KEY` is populated in server modules without going through that helper.

**Svelte MCP:** When editing `.svelte` files, use the official Svelte MCP (`list-sections` / `get-documentation` / `svelte-autofixer`) per project rules. Re-run autofixer until clean.

---

## Repository map

```
src/lib/grades/          # bands, conversions (Ewbank ↔ French/YDS/V/Font)
src/lib/ticks.ts         # tick kind + STYLE_COLORS (Sport blue / Trad orange / Boulder red)
src/lib/types/dashboard.ts
src/lib/components/      # UI: pyramids, CPR, notable, TickTypeIcon, StyleBadge, …
src/lib/server/
  analytics.ts           # dashboard aggregations
  cpr.ts                 # approximate CPR (not a proprietary theCrag clone)
  ingest.ts              # upsert + reconcileProviderAscents
  sync.ts                # runTheCragSync (API full pull + prune)
  routeHistoryEngine.ts  # opt-in FA/FFA route-history import: cache, pacing, marks (#68)
  routeHistoryImport.ts  # env + impers wiring, background trigger after sync
  weatherEngine.ts / weatherImport.ts  # opt-in Open-Meteo outdoor day cache + badges (#268)
  providers/thecrag/     # API + CSV parser (manual uploads) + routeHistoryApi/Parse
  providers/openMeteo.ts # Historical Weather API client
  db/schema.ts
migrations/              # 0001_init.sql, … 0017_weather_days.sql
scripts/                 # migrate, docker-entrypoint, worker
.github/workflows/       # ci, docker-release (version tag → GHCR)
```

Client components must **not** import from `#lib/server/*` except via `import type` from shared `#lib/types/*`. Server modules pull in `better-sqlite3`.

---

## Sync model (critical)

Entry: `runTheCragSync()` in `src/lib/server/sync.ts`.

1. Pull **all** pages from `https://www.thecrag.com/api/logbook/ascents` (no `since` filter). Incremental cursors cannot see deletes.
2. `upsertAscents` — overwrite local fields from the provider payload (do not coalesce “keep old if API null” for content fields; upstream wins).
3. `reconcileProviderAscents(provider, seenIds, { expectedCount })` — delete local ascents whose `external_id` was not seen; then orphan routes/projects.
4. Safety: if API returns **0** ascents but `account.ascentCount > 0`, **refuse to prune** (partial failure guard).
5. `refreshProjects()` after sync.
6. Scheduler (`SYNC_CRON`, default daily) calls the same reconcile path. It starts from the `init` hook in `src/hooks.server.ts` at server boot, not on the first request.
7. **Fresh install:** if no sync has ever succeeded (`sync_state.last_success_at` is null), the scheduler runs one sync straight away at boot. A failed first sync is retried on the next boot or cron tick.
8. **Existing install:** at boot the scheduler instead triggers the opted-in route-data and weather imports once (`resumePendingImports`), so work an upgrade queued (e.g. weather area lookups) starts without waiting for the next sync. They make no request when nothing is pending and keep their persisted pacing/back-off.

Cursor/`maxEpoch` is still stored for diagnostics; it is **not** used to skip a full pull.

API sync errors must use fixed messages, never upstream response text or transport error details (these can echo API keys). `apiErrorAdvice` names invalid keys, missing logbook access, and usage limits; the only upstream text allowed through is `safeErrorLabel` (lowercase hyphenated `errorLabel` code, ≤60 chars, never containing the key). A failed page keeps earlier upserts but never prunes or advances the successful-sync timestamp; the next scheduled/manual run starts at page 1. `data:0011` removes legacy saved API error bodies on upgrade; existing external logs still need owner cleanup/key rotation.

### Automatic CSV mode was removed

Earlier releases had `THECRAG_SYNC_MODE=csv`: a saved website login (`THECRAG_USERNAME` / `THECRAG_PASSWORD`, cookies encrypted in `thecrag_web_sessions`) downloaded the CSV export on the sync schedule. theCrag asked us to remove it: daily full exports are costly for them, and their terms require all programmatic access to use the API. Migration 0021 drops the cookie table. `getTheCragSyncConfiguration()` only reports whether an API key is set; the old env vars are ignored (owners delete them). Manual CSV upload (Settings → CSV import, upsert-only) stays. Wipe still bumps `syncGeneration` so in-flight API syncs cannot write after a wipe.

User docs: `docs/guide/logbook-sync.md` (also `/docs/logbook-sync` in the app; keep it in `DOC_PAGES` — Settings links here).

Height quirk: theCrag may return height as `[value, unit]` arrays — parse in the API mapper (`parseHeightMeters` / array handler).

---

## Grades & colours

- Canonical numeric scores lean on **Ewbank** for routes and **V-scale** for boulder; convert for display via `src/lib/grades`.
- Band palette (Beginner → Elite) matches theCrag article colours — see `bands.ts`. Boulder: VB± green, **V0± yellow** (Intermediate), V1–V4 orange, V5–V10 red, V11+ purple (`bandFromVScale`).
- Display systems (#447): two site-wide settings, `app_settings.route_grade_system` (ewbank/french/yds, default Ewbank) and `boulder_grade_system` (v_scale/font, default V-scale), read via `getDisplayGradeSystems()` as a `DisplayGradeSystems` pair. Each falls back to the legacy `grade_system` row (`displaySystemsFromLegacy`: a route value keeps V boulders, `font`/`v_scale` keep Ewbank routes); never delete that row. Pass the pair to `formatGradeLabel`. `?system=` (route or boulder value) and `?boulderSystem=` are one-off overrides via `applyDisplaySystemOverrides`; the old `cs_grade_system` cookie is no longer read.
- **Style pyramids** group by Sport / Trad / Boulder / Top rope / … with stacked tick segments. Do not dump mixed VB + `7a` + `19` in one unordered list. Pyramid grade chips/bars link to `/logbook?style=&score=` (integer score buckets).
- **Scale comes from the grade system, not gear style (#72).** Decide "is this score V-scale?" with `usesVScale(route.gradeSystem, gearStyle)` (`src/lib/grades/bands.ts`). V-graded DWS/highballs are V-scale; gear style is only the fallback when the system is `unknown`. Pyramids key such styles as `"<Style> · V"`. Never test `gearStyle` for `boulder` to pick a scale.
- **Grade-system fit:** reject boulder CPR/V-scale on sport/trad (caused Trad `−1` / VB rows). On boulder, bare numbers without grade-system context (e.g. Upendi `5`) map to **V5**; explicit AU/Ewbank context converts through Ewbank to V-scale. Font `5A` must not steal French `5a` on routes.
- **V-scale ranges** like `V1/2` or `V5/6` must parse as midpoints (1.5, 5.5). Never fall back to gradeBand Ewbank midpoints (21/28/…) as V-scores — that produced fake “V21” / “V28”.
- **Multipitch:** use `ascent.pitch[]` from the API. Effective grade = hardest **climbed** pitch (not the full route grade). Store `effective_grade_*` + `pitch_label` (e.g. `P1`) on ascents. Analytics/hardest lists must use effective grades. `repairGradesFromRawJson()` re-derives from stored `raw_json` after parser fixes (also partners/quality/label/tags).
- **Ascent meta from API:** `with` → partners, `quality`/`qualityLabel`, `label` → ascent_label (prefer over route name when set), `route.tags` → tags_json chips, account `outdoorAscentCount` / `indoorAscentCount` / `typeOfClimber` / `heightClimbed`.
- **URLs:** `urlAncestorStub` is an _area_ path and often has **no leading slash**. Never concatenate as `https://www.thecrag.com${stub}` (produces `thecrag.comaustralia/...`). Use helpers in `src/lib/thecragUrls.ts`:
  - Route: `https://www.thecrag.com/en/climbing/{stub}/route/{routeId}`
  - Area/crag (TLC): `https://www.thecrag.com/en/climbing/{stub}/area/{areaId}` (e.g. Castle Hill)
  - Ascent (preferred for “your tick” links): `https://www.thecrag.com/ascent/{ascentId}`

---

## Analytics quirks

- Owner project choices (#424) live in `project_overrides` keyed by provider/external route ID (no route FK), separate from derived `projects` and theCrag's route flag. Include bypasses automatic day/staleness thresholds; exclude suppresses detection; auto removes the override. Actual logged sends still determine sent status. Refresh/list/dashboard/sidebar share selection, and wipe clears it. Keep overrides across upstream route pruning, like FA marks.

- Project progression (#423): `/projects/[routeId]` and cards use `server/projectProgress.ts`; same discipline + grade scale, distinct-route effective-grade sends in prior 365 days, own route excluded from support, historical snapshots never use later evidence. Readiness base caps at 94, then `sessionReadiness` adds one point per additional qualifying day (first establishes baseline), capped at 99 until a send; grade goals share this helper with near-target working days in their year/venue. Project readiness reaches 100 only when the target route sends; V0/negative V grades work. Remaining effort uses at least three longer completed comparable projects per metric, otherwise withheld. `projectDetails.ts` selects a whitelist with no comments/raw JSON; notes stay in the logbook.

- Logbook wind filters use cached daily max 10 m wind: `weather=wind` ≥50 km/h (same as Blown Away), `weather=calm` measured 0–<25 km/h (same calm threshold as Perfect day). Missing readings and indoor rows never match; 25–<50 km/h is neither filter.

- **Ungraded routes = likely projects.** theCrag's API has no project flag. Ungraded routes come back with `grade: null`, `gradeBand: 0`. `isUngradedRoute()` (`projects.ts`) also accepts a literal "Project"/"Proj" grade, and project cards show `NewRouteBadge` ("New route?"). In training load, `isUngradedWork()` treats an unsent tick with no grade at all (route or your own) as at your 12-month max; ungraded sends stay at 0.3.
- **Climber type:** if one of Sport / Trad / Boulder is ≥ **40%** of ascents → “Sport climber” (etc.); else “Rock climber”.
- **CPR timelines:** approximate model in `cpr.ts` (power factor P=5, tick shifts, ~0.7 grade/year decay). Link/docs: theCrag CPR articles. Label UI as approximate — not a byte-for-byte clone.
- **Notable ascents:** by style + by area; use `StyleBadge` + `TickTypeIcon` (theCrag-like SVGs).
- **First ascents:** theCrag has no FA tick type; FAs live in route history, which the logbook API doesn't return. The owner marks FA/FFA in the logbook (`first_ascents`, 0009). Optionally (`ROUTE_DATA_IMPORT=true`, **off by default**) `routeHistoryEngine.ts` imports public history in the background after each sync: each route **once** by default (`route_history_fetches`), or opt-in rolling refresh via `ROUTE_DATA_REFRESH_DAYS` (whole days ≥ 30, e.g. 90 or 180), **100 routes per run**, ≥1.1 s between requests, one `impers` session per run, stop + back off (≥24 h, honours Retry-After) on any block. Auto-marks only on an exact `@login` match and never overrides manual marks/unmarks. Details: `docs/dev/ROUTE_HISTORY.md`. Mark/unmark and import actions require `locals.authed`.
- Summary metrics: onsights, successful ascents, distance climbed (km).
- **Weather (#268):** opt-in `WEATHER_IMPORT=true` (off by default). After sync (and Settings, background), caches Open-Meteo archive days for outdoor ascents with route lat/lon (rounded to 1 decimal), **50 days per run** oldest-first, ≥1.1 s between requests, back-off on errors. Badges skip indoor rows even when a shared cache key exists: `weather_heat` (≥35°C max), `weather_freeze` (≤0°C min), `weather_rain` (≥1 mm, not snow), `weather_snow` (WMO 71–77/85–86 or precip + max ≤1°C), `weather_wind` (max 10 m wind ≥50 km/h). Wipe clears `weather_days` / `weather_import_state`. Docs: `/docs/weather`.

---

## UI icons (theCrag-like)

| Tick         | Visual                   |
| ------------ | ------------------------ |
| Onsight      | Blue eye                 |
| Flash        | Yellow bolt, red outline |
| Red point    | Red filled circle        |
| Pink point   | Pink filled circle       |
| Tick         | Black check              |
| Clean / Send | Green check              |
| Top rope     | “Top” text + small check |

Components: `TickTypeIcon.svelte`, `StyleBadge.svelte`. Keep icons SVG-inline so they theme/print cleanly.

---

## Theme & app shell

- Logbook long notes use native details/summary: swap the truncated and full text inside the summary with open-state CSS so expansion shows the comment only once and stays keyboard accessible without JavaScript.

- Karma is disabled in the default dashboard catalog but remains selectable in Settings. Preserve explicit saved/legacy visibility; missing cards use their catalog default. Existing installs without a saved layout and Clear saved layout also hide Karma.

- **Tokens only.** Colours come from `src/app.css` (`--bg`, `--paper`, `--surface-2/3`, `--ink`, `--ink-muted`, `--line`, `--accent` rope orange, `--accent-soft`, `--shadow`). Don't hard-code `white`/`#fff` surfaces or ink-tinted `rgba()` — they break dark mode. Use `color-mix(in srgb, var(--ink) N%, transparent)` for tints. `color: #fff` on an accent/coloured fill is fine.
- SVG presentation attributes can't take `var()` reliably — use `style="stroke: var(--ink)"` instead.
- Mobile header wordmark (#337): small Stats text uses `--accent` at the ≤860px breakpoint for normal-text contrast; desktop/mark retain `--brand`. Keep mobile light/dark full-page Axe coverage, including the header.
- **Dark mode:** OS preference by default; header toggle stores `cs_theme` in localStorage → `html[data-theme]`. Applied pre-paint by the inline script in `app.html`.
- **Shell (Dreeve-style):** fixed top bar (sidebar toggle, logo, GitHub, theme, settings, log out when signed in) + grouped icon sidebar with count badges (`navCounts` from `+layout.server.ts`, hidden when `AUTH_SCOPE=all` and logged out). Desktop toggle collapses to a mini icon rail with hover tooltips (`cs_sidebar=mini` → `html[data-sidebar='mini']`); ≤860px it's an off-canvas drawer.
- Icons: `NavIcon.svelte` (inline outline SVGs). Logo/favicon: `src/lib/assets/favicon.svg` (flat orange crag, grade bars masked out / transparent through the base — no circle, no gradient). Wordmark lockup is always ink "Crag" + orange "Stats".
- Full style guide (tokens, logo, theCrag band + discipline colours, shell): **`docs/dev/BRANDING.md`** — update it with any visual change.

## In-app docs (/docs)

- User-facing explanations live in **`docs/guide/<slug>.md`** and are rendered at `/docs/<slug>` (bundled at build time via `import.meta.glob`, rendered with `marked`). Order/titles come from `DOC_PAGES` in `src/lib/docs.ts`; add new pages there.
- `<!-- component:name -->` markers embed generated tables from `DocBlock.svelte` (grade bands, conversions, tick types) so docs never drift from code. `docs.test.ts` checks tick-type send/attempt labels against `classifyTick()`.
- **When you change an analytic (climber type, CPR, training load, grades), update its doc page in the same PR.** Dashboard cards link to their page ("How it works").
- Paraphrase theCrag articles and link the source; don't paste their text.
- **User guides describe current behaviour only.** Keep upgrade steps, migration notes, removed-feature fallbacks, and env vars to delete out of `docs/guide/` (and README/DEPLOY). Put them in the PR's `## Release notes` section, which feeds the GitHub release, and in `docs/dev/*` or AGENTS.md when agents need them.
- **Use the Oxford comma** in every list of three or more, in UI copy, docs, comments, and commit/PR text: "hot, freezing, wet, or windy", not "hot, freezing, wet or windy".

## Docker / release

- Compose: `docker-compose.yml` (build) and `docker-compose.ghcr.yml` (pull image).
- `docker-release.yml` builds multi-arch and pushes on version tag pushes (`v0.1.0`, …), manual dispatch, or `workflow_call`. There is no `release` trigger: `gh release create` (or a UI release with a new tag) pushes the tag, and a second trigger built every release twice (#164). Publishing a release for an existing tag does not rebuild; use manual dispatch.
- `nightly-minor-deps-release.yml` runs daily (~00:17 AEST). `npm-check-updates --target semver --cooldown 3` raises package.json ranges within each dependency's major; 0.x packages only get patches. pnpm then re-resolves only the changed specifiers in the lockfile, because frozen installs need the two in sync. After that: lint, check, test, build and e2e. **Release only when a package that reaches the image moved**: patch bump, tag, GitHub release, and image via `docker-release.yml`. That includes the devDependencies SvelteKit bundles into `build/` (svelte, kit, vite, tailwind, adapter-node). Only devDependencies listed as tooling in `scripts/nightlyRelease.mjs` (lint, format, typecheck, tests, `@types/*`, drizzle-kit) and `packageManager` skip a release; those updates are still committed to `main` after the suite. Unknown devDependencies count as shipped, so add new tooling to that list. It does nothing when no range moved. It pushes straight to `main`, so branch protection on `main` needs a bypass for Actions.
- The Docker runner uses distroless Debian 13 plus the build stage's Node 26 binary, with no shell or package manager. Runtime maintenance must use `node scripts/*.mjs`; package managers remain in the build stage. Container scan evidence and unresolved OS findings: `docs/dev/DOCKER_SECURITY.md`.
- CI's importer smoke test (#371) keeps impers' downloaded libcurl-impersonate in `actions/cache` (mounted as `IMPER_CACHE_DIR`). `container-smoke.mjs` resolves the library through impers' loader with retries before importing `impers`, whose import calls `koffi.load` immediately and hides download failures as an empty-path load error.
- `.dockerignore` keeps host dependencies, generated output, local env files and SQLite caches out of build contexts. Keep source, migrations, bundled docs and package-manager configuration included.
- Entrypoint runs migrations before app/worker start; `ensureSchema()` (`src/lib/server/db/index.ts`) applies the same files under `pnpm dev` / `node build`. Persist SQLite via volume (`DATABASE_PATH`).

### Migrations must survive every release

Every release, including the automated nightly one, gets pulled straight onto running homeservers (`docker compose pull && up -d`). There, `scripts/docker-entrypoint.mjs` applies pending migrations before the app starts. If a migration fails, the container exits and the instance stays down until someone fixes it. So:

- **Append only.** Add a new `migrations/NNNN_name.sql` with the next number. Never edit, rename or delete a migration that has shipped. `schema_migrations` tracks file names, so an edited file never re-runs on existing DBs and fresh DBs end up with a different schema.
- **Bundle unreleased migrations.** Append-only applies once a migration ships in a release tag. Before adding a SQL or `data:` migration, check whether the previous one has shipped (`git tag --contains <commit that added it>`, or `git diff --name-only <latest tag> origin/main -- migrations src/lib/server/db/dataMigrations.ts`). If it hasn't, fold your change into it instead of adding another file or ID, and update its upgrade test. Then reset local dev databases that already ran the old version: delete that migration's `schema_migrations` row and undo or redo its effect (or wipe the dev DB), so dev doesn't run on a schema or data that no released build produces.
- **Upgrade from any older version.** Users skip releases. Files apply in order, each in its own transaction, so each one must work on the schema the previous file left, with real data in the tables.
- **Additive and backwards-safe.** Prefer `ADD COLUMN` (nullable or with a `DEFAULT`), new tables and `CREATE INDEX IF NOT EXISTS`. SQLite can't alter or drop most columns in place. For those, rebuild the table inside the migration (create new → copy → drop → rename).
- **Never lose local-only data.** A sync or `repairGradesFromRawJson()` can rebuild cached provider data. Nothing can rebuild settings, goals, dashboard layout or anything else entered locally.
- **Keep `src/lib/server/db/schema.ts` (Drizzle) in step** with the SQL.
- **Parser/data upgrades:** append a TypeScript migration in `src/lib/server/db/dataMigrations.ts` when a repair needs application logic. The server `init` hook runs these after SQL migrations, before the scheduler and requests, and skips them during builds. Their `data:` IDs share `schema_migrations`; each repair and completion marker commit atomically, and a failure is logged without stopping the server, so each must leave the app usable if it never runs (cache repairs, or carrying over settings like `data:0002` does for the env vars #84 removed). Never edit an applied migration; add a new ID for a later fix.
- **Route-info cache upgrades:** when a migration adds or extends cached `/api/route` fields on `routes`, invalidate affected `route_history_fetches` rows with `status='ok'` in the same upgrade (SQL and/or `data:` migration) so incomplete fetch-once caches re-queue automatically — see `docs/dev/ROUTE_HISTORY.md` and `data:0004_invalidate_incomplete_route_cache` (#209). Do not tell owners to run Settings → Refresh all after schema upgrades.
- **Test the upgrade path.** `src/lib/server/migrations.test.ts` (in `pnpm test`) starts from every older schema prefix (fresh, 0001…, current), inserts data, runs `scripts/migrate.mjs` to the latest, and checks the data survives, a second run is a no-op, and every Drizzle table/column exists. When a migration adds local-only data (like `app_settings` or `first_ascents`), extend `oldDatabase()` to seed it. For risky migrations (table rebuilds), also start the new build against a copy of a real DB from the previous tag.
- Release notes should call out slow migrations, such as table rebuilds on big logbooks.

---

## Commands

GitHub YAML is covered by Prettier too; format Dependabot/workflow edits with the repository config (single quotes) before running `pnpm lint` (#418).

```bash
pnpm install
pnpm dev
pnpm test           # Vitest unit tests (grade fixes, URLs, mapAscent)
pnpm test:related src/lib/foo.ts   # only the unit tests that import the given files
pnpm test:changed   # unit tests affected by changes vs origin/main (falls back to all on config/dep changes)
pnpm check          # svelte-check
pnpm lint           # Prettier --check + ESLint, cached in node_modules/.cache (run `pnpm format` to fix)
pnpm build
pnpm test:e2e       # Playwright + axe against the production build (run `pnpm build` first)
pnpm exec playwright test e2e/foo.spec.ts   # one browser spec (after `pnpm build`)
```

### Before push / finishing a PR (required for agents)

Do **not** push a branch, open/update a PR, or claim the task done until the checks for your change type below pass **locally**. Do not rely on CI as the first formatter or typecheck. `pnpm lint` is always required; when unsure which row applies, use the stricter one. Timings, the full matrix and what runs on PRs vs releases: `docs/dev/TESTING.md`.

| Change                                                                                           | Local checks                                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Docs / comments only                                                                             | `pnpm lint`                                                                                      |
| Simple copy, styling or markup in `.svelte` (no logic)                                           | `pnpm lint`, `pnpm check`, Svelte autofixer, plus the one browser spec covering that page if any |
| Logic in `src/lib` / routes                                                                      | `pnpm lint`, `pnpm check`, `pnpm test:related <files>` (or `pnpm test`)                          |
| New page/route, e2e fixtures, shared components or tokens (`app.css`)                            | all of the above + `pnpm build` + `pnpm test:e2e`                                                |
| Auth/CSRF, private notes, sync/pruning, migrations, grades, dates/time zones, build/Docker, deps | `pnpm lint`, `pnpm check`, full `pnpm test`, `pnpm build`, `pnpm test:e2e`                       |

If `pnpm lint` fails, run `pnpm format` (and fix any ESLint issues), then lint again. The lint caches are content-keyed; delete `node_modules/.cache` to force a cold run (CI is always cold).

When editing `.svelte` files, use the Svelte MCP autofixer until clean (see Stack & tooling above) **in addition to** `pnpm lint` / `pnpm check`.

CI (`.github/workflows/ci.yml`) always runs the full set on push/PR: the `check` job (`pnpm lint`, `pnpm check`, `pnpm test`) in parallel with two `e2e` shards (each `pnpm build` + `pnpm test:e2e --shard=N/2`, merged by `e2e-report`), plus the `docker` image build and smoke test on both architectures (no push). A newer push to the same PR cancels the older run. The nightly release repeats the full set. Local runs above are still mandatory so PRs do not burn a red check on Prettier-only or trivial type slips.

- **CodeQL (default setup):** Security scanning uses GitHub’s [default code scanning setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning) (`dynamic/github-code-scanning/codeql`), not a repo workflow. It runs on PRs **targeting `main` only**. Do not add a duplicate CodeQL workflow unless you explicitly dedupe against default setup.
- **Stacked PRs:** PRs whose base is a feature branch (not `main`) still get CI `check` / `docker` (and third-party checks such as Socket). Missing CodeQL there is expected — not “incomplete” checks. CodeQL runs when the stack merges to `main`. For native GitHub stacks, use `PUT /repos/{owner}/{repo}/pulls/{top_pr}/merge-async` with the reviewed head SHA and poll its result using the returned UUID; this merges all open downstack PRs too. The synchronous REST and GraphQL merge APIs reject native stacks. Validate every included PR and resolve conflicts with main before requesting the merge; never bypass repository rules. For ordinary branch stacks, merge bottom-up into their stack base, then open or retarget the final PR to `main`.

- E2E database isolation (#350): Playwright starts each named server through `scripts/e2e-server.mjs`, which deletes only its `e2e/.tmp/{open,settings,all}.sqlite` and WAL/SHM files before importing the production server entry. Do not reset in config evaluation or after servers have opened SQLite. Fixture teardown is still required within a run; traces/screenshots are preserved.
- CI browser sharding (#378): two `e2e` runners each build and seed their own three databases; retain `workers: 1` and `fullyParallel: false`. `e2e-report` merges shard blob artifacts even on test failure. Prove every spec passes individually before changing the split; never run suites concurrently in one checkout. Local/nightly runs remain unsharded. Five-run medians (slower shard 140 s ≤ arm64 170 s) live in `docs/dev/TESTING.md`.
- PWA offline downloads: installation/standalone launch enables public-only snapshots; `offlineClient.ts` checks online/foreground and the worker throttles refreshes to hourly (five-minute retry back-off). Daily periodic background sync is best-effort. The version-independent worker preferences cache preserves pause/back-off across upgrades; explicit clear/logout/mutations pause automatic downloads and invalidate queued/in-flight saves. Never automatically repopulate a paused copy.
- **Unit tests** get `DATABASE_PATH=:memory:` from `vitest.config.ts`, so each test file has its own empty SQLite. Never point tests at a shared file DB: parallel workers on one WAL file fail with `disk I/O error` (#57).
- **E2E** (`e2e/`, `playwright.config.ts`): three test servers on 4301–4303 (open, `AUTH_SCOPE=settings`, `AUTH_SCOPE=all`) with throwaway DBs in `e2e/.tmp`; the `setup` project imports `samples/thecrag-logbook-sample.csv`. The axe test fails on serious/critical violations in light **and** dark — fix contrast with tokens, don't weaken the test. Feature specs run their flow **once** and call `expectAxeClean(page, { include })` from `e2e/axe.ts` at each state worth auditing: it scans both themes in place with transitions disabled, so axe never samples colours mid-fade (#167). Scope `include` (a selector or a Locator) to the region the feature changed; `a11y.spec.ts` owns full-page/chrome audits, so scan a whole page only when the regression lives in shared chrome. Don't wrap a whole feature flow in a light/dark loop. Add a browser test only for user-visible flows or states a unit test can't reach (populated badges, pills, weather states, keyboard/focus); put logic regressions in Vitest. Guidance: `docs/dev/TESTING.md`.
- **Start the app with `node scripts/server.mjs`** (Docker `CMD`, `pnpm start`, e2e), not `node build`. adapter-node assumes https for CSRF origin checks and ignores `ORIGIN` in this version; `server.mjs` fills in `X-Forwarded-Proto` from the real connection when no proxy sent one, or pins protocol/host from `ORIGIN` (#47). Pure logic in `scripts/serverOrigin.mjs` (unit-tested).
- **CSP** is configured in `vite.config.ts` (`csp`, nonce mode). Inline scripts need `nonce="%sveltekit.nonce%"`; images allow `https:`/`data:`; no third-party scripts.
- **Dates/numbers:** use `formatDateTime` / `formatNumber` from `#lib/dates` with `data.dateDisplay` (layout) — never bare `toLocaleString()` (SSR/hydration mismatch, #36).
- `.git-blame-ignore-revs` lists the bulk Prettier commit.

Prefer fixing type errors over `@ts-ignore`. Do not switch the package manager.

---

## What not to do

- Don’t treat local DB as authoritative over theCrag for logbook rows.
- Don’t reintroduce incremental-only sync without a delete/tombstone strategy.
- Don’t import server DB code into client components.
- Don’t commit secrets, sample private notes, or real API keys.
- Don’t expand scope into wearables / Mountain Project until the matching epic is in play — keep PRs focused.
- Don’t claim CPR is identical to theCrag’s proprietary score.
- Don’t HTML-scrape theCrag route pages, and don’t loosen the route-history limits (fetch once unless `ROUTE_DATA_REFRESH_DAYS` ≥ 30 is explicitly enabled, 100 per run, ≥1 s gap, stop on block). `impers` is allowed only for one explicit opt-in: the `/api/route` history import (`ROUTE_DATA_IMPORT=true`, including identified `/api/area` location lookups when `WEATHER_IMPORT=true`, within the same ten-request budget). Never use it for the logbook sync. Never log in to theCrag's website or download its exports programmatically; nothing on theCrag pages may be scraped. Prefer negotiated theCrag API access.

---

## File issues for what you find

You'll often notice things outside the task at hand. **Don't silently fix them in an unrelated PR, and don't let them go unrecorded: file a GitHub issue.**

- **What to file:**
  - bugs (even if unconfirmed: say how you'd reproduce them)
  - code that needs refactoring or is duplicated
  - performance or security concerns
  - accessibility gaps
  - stale docs
  - missing tests
  - feature or UX ideas
- **Before filing**, search open and closed issues (`gh issue list --state all --search "<keywords>"`) and comment on an existing one rather than duplicating it.
- **One issue per problem.**
  - Title: `Area: short summary` (e.g. `Logbook: date column wraps on desktop`).
  - Body: what you saw (file:line, screenshot or steps), why it matters, and a suggested fix or acceptance criteria.
- **Label it:** `bug`, `enhancement`, `accessibility`, `documentation`, `analytics`, `sync`, `provider:thecrag`, `docker`, `good first issue` as fits. Add `help wanted` when it's well-scoped.
- **Mention it** to the user (with the link) at the end of your task. Link issues from PRs with `Fixes #n` / `Refs #n`.
- **Never put private data in an issue:** no logbook notes, API keys, real `.env` values or personal ascent data. Use the sample CSV or synthetic examples.

## Changelog for agents

| When    | Note                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03 | Initial MVP: sync, CSV, dashboard, pyramids, CPR approx, GHCR, pnpm                                                                                                                                                     |
| 2026-03 | Sync made full reconcile (upsert + prune). Tick/style SVG icons. This file created as living docs.                                                                                                                      |
| 2026-03 | Fixed V1/2 range parsing; multipitch effective grades (pitch ticks); hardest ascents use ascent effective grade.                                                                                                        |
| 2026-03 | Fixed broken theCrag links (missing slash / area stub); link to `/ascent/{id}` or `/en/climbing/.../route/{id}`.                                                                                                        |
| 2026-03 | Grade-system fit + AU boulder→V; pyramid→logbook links; partners/quality/label/tags; outdoor/indoor; ascent heatmap (#12–#25).                                                                                          |
| 2026-03 | AU ascent grades on V-scale boulder routes must not become V12 (prefer route V-grade). Notable rowspan grouping. Side nav + version. Blurb/streaks/climber profile.                                                     |
| 2026-03 | Vitest suite (`pnpm test`) for grade/URL/mapAscent regressions; CI runs tests.                                                                                                                                          |
| 2026-03 | Streaks: reject invalid ascent dates (`2018-00-00`); guard week/month loops — NaN week keys hung the dashboard.                                                                                                         |
| 2026-03 | Phase 4–5: CPR shifted/decayed + attempts + route lat/lon (migration 0006); Goals / Rewind / Sectors pages; SVG CragMap (no Leaflet dep).                                                                               |
| 2026-03 | Dashboard extras: monthly/yearly/milestones/training load, style mix, partners, stars/quality, rock types + blurb; CPR prefers API when dense; logbook sort/band/multipitch/season/sector; pyramid `?pyramid=` toggles. |
| 2026-10 | Auth harden: login rate limit, safe redirects, HMAC password/worker-secret compares, security headers, `/logout`. CF Access for `crag.luenwarneke.com` settings/login. CPR SVG NaN guards.                              |
| 2026-10 | Mobile: heatmap/charts scroll, yearly cards, notable stacked groups; pyramid active pill `--paper` + “All” label.                                                                                                       |
| 2026-10 | pnpm 12.15.0 via `packageManager`; config in `pnpm-workspace.yaml` (`allowBuilds`, `minimumReleaseAge: 0`). Docker reads pin from package.json.                                                                         |
| 2026-10 | Runtime pin Node 26 LTS (CI, Docker build `node:26-bookworm-slim` plus a minimal Debian 13 runner, `engines.node`, `.nvmrc`).                                                                                           |
| 2026-10 | Badges carousel on dashboard (RoxClimbs-style milestones from logbook: sends, onsights, countries, height, bands).                                                                                                      |
| 2026-10 | Goals: Active/Achieved + progress bars; grade = send ≥ X this year; venue_scope outdoor/indoor/any (migration 0007); dashboard shows 3 active goals.                                                                    |
| 2026-10 | `/projects` RoxClimbs-style auto-projecting cards: open = unsent attempts touched within 1 year; sent shelf = fought-then-sent within six calendar months; first-go sends never projects. No create form.               |
| 2026-10 | Dashboard Projects card: top 3 open by sessions/tries (`listDashboardProjects`); layout id `projects` beside goals.                                                                                                     |
| 2026-10 | Dashboard card show/order via cookie `cs_dash_layout` (Dreeve-style); hero + metrics fixed; Customize panel on `/`. Defaults = current order. See `dashboardLayout.ts`.                                                 |
| 2026-10 | Discipline colours unified via `STYLE_COLORS` in `ticks.ts` (Sport blue, Trad orange, Boulder red) — Style mix + climber-type share the same palette as StyleBadge.                                                     |

| 2026-10 | Dreeve-style redesign: theme tokens + dark mode, Plus Jakarta Sans, new logo, top bar + collapsible mini sidebar / mobile drawer, nav count badges. |

| 2026-10 | `app_settings` table (0008): grade system + "Show in search engines" (dynamic `robots.txt`, `X-Robots-Tag`, meta noindex; forced off for `AUTH_SCOPE=all`). Sync status + grade picker moved from the dashboard hero to Settings; Customize dashboard is admin-only. |

| 2026-10 | v0.3.0: README showcase (logo, badges, `docs/screenshots/`; regeneration steps in `docs/dev/BRANDING.md`). Rewind/Goals selects use `--paper` (were white in dark mode). |

| 2026-10 | Issues #36–#45: DISPLAY_LOCALE/TZ date formatting; site-wide dashboard layout; cheap project badge count; lint in CI + repo-wide Prettier; CSP; colour tokens (`--style-*`, `--danger`, `--gold`, `--heat-*`); logbook nowrap; System/Light/Dark theme + drawer focus; OG/sitemap/manifest/icons; Playwright + axe e2e. UI accent is now `#c2410c` (AA); `--brand` `#ea580c` for logo/wordmark. Fresh DBs under `node build` now find `./migrations`. |

| 2026-10 | In-app docs at `/docs` (climber type, grades + conversion tables, tick types, CPR, training load). Training load is now an intensity-weighted acute:chronic model (`src/lib/server/trainingLoad.ts`). CPR timeline redesigned (real band boundaries, monotone curve, legend). Ewbank→French 10–13 fixed (was non-monotonic). |

| 2026-10 | #47: `scripts/server.mjs` entry (plain-HTTP LAN + proxy + `ORIGIN`) replaces `node build`; e2e runs plain HTTP with a CSRF negative test. |

| 2026-10 | Private ascent notes are opt-in (Settings only, owner only). First ascents card plus owner-marked FA/FFA in the logbook (migration 0009, `/docs/first-ascents`). |
| 2026-10 | #84: `show_notes` and `grade_system` are Settings/DB only — no `SHOW_PRIVATE_NOTES` or `PREFERRED_GRADE_SYSTEM` env. |

| 2026-10 | Customize dashboard moved to Settings (`/settings#dashboard`, actions `saveDashboardLayout` / `resetDashboardLayout`); the dashboard keeps an owner-only "Customize dashboard" link. |

| 2026-10 | #68: opt-in route-history import (`ROUTE_HISTORY_IMPORT`, off by default). Runs in the background after sync: each route once, 100 per run, ≥1 s between requests, back-off on blocks. Migration 0010: `route_history`, `route_history_fetches`, import state, FA import skips. Dev notes in `docs/dev/ROUTE_HISTORY.md`. |
| 2026-10 | #68 follow-up: migration `0011` upgrades DBs that applied the first draft of 0010 (offset/total cursor) to the fetch-once `last_run_at` shape. |
| 2026-10 | Route history import caches route API fields on `routes` (migration `0012`, #77–#82): project flag, seasonality, popularity, qualityScore, beta, ancestors, pitches, flags. Request `show=info,ancestors`. `#80`: scatter + logbook quality sort use `routes.quality_score` when present (`#lib/qualityScore.ts`). `/sectors` nests areas when `ancestors_json` has depth (#82); pitch/flag hints when import filled `pitches_json` / `flags_json`. |
| 2026-10 | Logbook filters: `fa=FA|FFA|any|none`, `history=pending` (owner + import on only), plus `quality`, `minStars`, `with`, `from`/`to`. Marks load before filter/page in `listLogbook`. |
| 2026-10 | Logbook richer filters (#85): multi `style`/`tick`/`quality`, `minScore`/`maxScore` (routes only), `partners=has|missing`, from/to override year/season. |
| 2026-10 | Logbook facet inventory (#86): `docs/dev/LOGBOOK_FACETS.md`; `missing=height|bolts`, `tag=` substring on `tags_json`. |
| 2026-10 | Dashboard **Route popularity** card (#79): busy vs quiet tick share, hidden gems; `/docs/route-popularity`; logbook sort by Pop.; card hidden until any route has popularity cache. |
| 2026-10 | Logbook `?sort=` keys: `date`, `grade`, `quality`, `stars`, `style`, `tick`, `ascents` (your ticks on route), `popularity` (cached route info; nulls last). `?order=asc|desc`. Comparators in `logbookSort.ts`. |

| 2026-10 | #133: shared qualityScore helpers rank all theCrag labels distinctly; explicit low ratings win over star fallbacks. |

| 2026-10 | #132: logbook popularity uses shared relative/global score precedence, with count-only routes null-last; quality sort shares the rating helper. |

| 2026-10 | #131/#36: hidden gems retain routeId for stable list keys; popularity counts use the configured display locale. |
| 2026-10 | #284: Route popularity hidden gems capped at 3 (`MAX_GEMS`); gem titles use normal list size (bucket `%` keeps large `strong`). |

| 2026-10 | #126/#127: tick facets include top-rope/solo types and preserve selected legacy values; style filters normalize dws and top-rope aliases. |

| 2026-10 | #125: logbook labels retain ordinary ascent methods such as top-rope alongside route discipline, as well as solo variants. |
| 2026-10 | #76: route setter credits from cached `route_history` — badges (1/5/10/25), `routesSet` on First ascents card; FA milestone badge `fa_5` renamed **5 First Ascents**; **Route Developer** reserved for 5 routes set. |
| 2026-10 | #134: setter credits with missing or invalid dates keep a null date through badge generation; never fabricate 1970. |

| 2026-10 | #129: sector links use an exact sectorPath beneath the crag (including descendants); legacy sector names also match cached ancestors. |
| 2026-10 | #130: Project training load uses explicit ascent/CSV/pitch grade evidence; effective route fallback grades are not personal overrides. |
| 2026-10 | #28: Best months exposes monthly seasonality and ascent counts in a keyboard/screen-reader accessible values table. |
| 2026-10 | #128: route-info fields distinguish absent (preserve) from explicit null (clear); refresh can remove stale beta, access warnings and ratings. |
| 2026-10 | Dashboard First ascents card title links to `/logbook?fa=any`. |
| 2026-10 | #109: `/partners` full leaderboard; dashboard partners capped at 7; partner and rock-type rows link to logbook `?with=` / `?rock=`; logbook `rock` filter on route `tags_json`. |
| 2026-10 | #109: partner leaderboard links use partnerMatch=exact with the same tokenization as counts; free-text With defaults to substring matching. |

| 2026-10 | `/eddington` detail page: yearly E timeline, milestone tables, sidebar link; dashboard card title links there (#110). |

| 2026-10 | #28/#36: Eddington timeline has exact yearly values in a native details/table and pressed-state metric buttons; active-day count uses configured locale. |
| 2026-10 | #117 / #123: cached grade repairs run as versioned TypeScript data migrations in `src/lib/server/db/dataMigrations.ts` at server startup, after SQL migrations and before the scheduler. IDs use `data:` in `schema_migrations`; append new migrations instead of editing applied ones. Repair + marker commit atomically; a failure rolls back, is logged, the server still starts, and it retries next boot. No Settings repair action or dashboard-triggered repair. Image builds skip data migrations. |
| 2026-10 | #112: AU boulder route grade bare `9` with ascent `gradeSystem=AU` maps via Ewbank→V (VB), not fake V9. FA cards and repairs use provider grade-system evidence, never country alone. |
| 2026-10 | #124: grade repair preserves API grade-system evidence and never infers AU from country; FA labels use repaired canonical scores. |
| 2026-10 | #104: `/docs/first-ascents` “What you need” — FA card/badges need owner marks or `ROUTE_HISTORY_IMPORT`, not `SHOW_PRIVATE_NOTES`. |
| 2026-10 | #107: Document CodeQL default setup (PRs to `main` only) and stacked-PR check expectations; minimal PR template. |
| 2026-10 | `data:0002_legacy_env_settings` copies the removed `PREFERRED_GRADE_SYSTEM` / `SHOW_PRIVATE_NOTES` env values into `app_settings` once, when Settings has no value yet. A failed data migration is logged and the server still starts. |

| 2026-10 | #135: First ascents card shows community (non-owner) ticks on FA/setter routes from cached `routes.ascent_count`, with a sport/bolted split (`routeDeveloperImpact.ts`). |

| 2026-10 | #140 / #141 / #144 / #148: `routes.ascent_count_own` is captured with each replaced `ascent_count` by route-history import (0013). Never subtract today's logbook from an older total. Legacy counts need an explicit refresh for a paired snapshot. Show cached/eligible coverage, known zeros and estimate labels. First-ascents keys use route IDs; hardest-send keys use ascent IDs, never names/dates. |

| 2026-10 | #147: First ascents card lists per-route community impact; `routes.ascent_count_fetched_at` (0014) records counter freshness separately from `route_info_updated_at`. |

| 2026-10 | #146: Community-ascent badges (10/50/100/500 + sport/bolted 10/50/100) from paired impact estimates; earned date stays null; detail discloses coverage. |

| 2026-10 | #151: each milestone has a stable `id` (grade system/score, count or height threshold, or FA threshold id — not per-route). Svelte keys use that ID; matching route names and dates are valid distinct events. |

| 2026-10 | #158: dashboard `{#each}` keys prefer stable ids (BarList `id`, sector path, stars bubble score\|y). Never key climb lists by name/date alone; aggregated name keys (partners, crags) are OK when the map is unique by construction. |

| 2026-10 | #154 review: community route rows preserve FA versus FFA credit; unrelated route-info refreshes must retain the counter timestamp. Browser tests distinguish Latest rows from community rows. |

| 2026-10 | #152 review: community badge estimates and coverage use the layout's dateDisplay locale, passed through getDashboardStats; never hard-code en-US for these details. |

| 2026-10 | #150: setter-only First ascents cards omit the empty style chart and Latest section; browser regression runs axe in light and dark. |

| 2026-10 | #136: Karma dashboard card approximates ascent points (1× distinct routes / `routesTicked`); edit karma stays unavailable until theCrag exposes it on a syncable API. |

| 2026-10 | #142 / #143: Karma's local tile counts distinct provider-matched routes with logged ascents; orphan metadata contributes no points. Account estimates and local route counts must retain distinct source labels. |

| 2026-10 | Agents must run `pnpm lint`, `pnpm check`, and `pnpm test` locally before push / opening or updating a PR / claiming done; fix Prettier with `pnpm format`. Do not treat CI as the first formatter. |

| 2026-10 | #161: `resolveMigrationsDir` walks up from the module to the nearest `crag-stats` package `migrations/` (not a fixed `../../../../`). Nested checkouts / review worktrees no longer inherit a parent's older migrations. `MIGRATIONS_DIR` still wins. |
| 2026-10 | theCrag returns private ascent comments in `privateMarkdown`, separate from public `markdown`. `ascentNotes()` (`thecrag/api.ts`) joins both into `ascents.comment`, which stays owner-only. Blank comments are stored as null. |

| 2026-10 | #168 review: API-note regressions cover mapping through upsert, hidden-note searches, opted-in owner access, dashboard exclusion and clearing notes on later sync. Public and private comment sources share the same owner-only display gate. |

| 2026-10 | #86: `/logbook` adds `project=yes\|no` (route-info Project flag; unknown matches neither) and `setter=me\|none` (cached setter history). Raw `flags_json` names beyond Project/isSport/isTrad/isBoulder are unverified, so no bolted/top-rope/artificial facets yet. See `docs/dev/LOGBOOK_FACETS.md`. |
| 2026-10 | #171: Logbook `missing=pitch` (alias `pitches`; UI label "No pitch list cached") matches routes whose route info was fetched (`route_info_updated_at` set) but `pitches_json` is null, `[]` or unparseable. Without a live API fixture we do not know whether theCrag omits `pitches` for single-pitch/boulder routes, so the facet includes them and must not be read as "multipitch routes missing data". Routes with `route_info_updated_at` null match nothing; that is NOT the same as `history=pending` (route-history ledger). Helper: `classifyRoutePitches()` in `routePitches.ts` (`unchecked`/`null`/`empty`/`invalid`/`known`). |

| 2026-10 | #173: Documented the route API flag strings our parsers recognise (only `Project` → `is_project` / `project=` is confirmed from the provider; `IsSport`/`IsTrad`/`IsBoulder` are code-recognised only, unverified against the live API, and drive sector style hints only) with parser/test evidence in `docs/dev/LOGBOOK_FACETS.md`. Natural/artificial and bolted/top-rope logbook facets stay blocked until a sanitized `/api/route` fixture shows real flag names — no HTML scraping. |

| 2026-10 | #166 review: setter facets resolve each route provider's owner profile and key credits by provider plus route ID. "No setter credit found" includes routes without imported history; do not describe that as a confirmed absence of setter credit. |

| 2026-10 | #164: `docker-release.yml` triggers on version tag pushes only (no `release: published`), so `gh release create` builds the image once. Nightly releases still publish via `workflow_call`. |

| 2026-10 | #169: enabled route imports enrich up to 100 pending routes after each successful sync, in 10-route requests. Pacing, back-off and fetch-once rules still apply. |

| 2026-10 | #206 / #207: **First Moves** badge is dated by the first successful non-empty import (`app_settings.first_import`, `src/lib/server/firstImport.ts`), not the earliest climb. `updateSyncState` (running → idle with `lastSuccessAt`) and manual CSV import call `beginFirstImport`/`completeFirstImport`. `wipeAllData()` clears the key and bumps a generation so in-flight imports can't recreate it. `/docs/badges`; the dashboard Badges card links there. |

| 2026-10 | Snyk triage and the pnpm 12 multi-document scan limitation are recorded in `docs/dev/SECURITY_SCAN.md`. Playwright generates per-run credentials and shares them with workers through test-only environment variables. |

| 2026-10 | `node scripts/snyk-projects.mjs` prepares separate temporary application and boot/config projects for pnpm 12 Snyk scans. Scan every emitted project and preserve any failure; never merge their shared importer maps. |

| 2026-10 | #186: Climbing story (`climberBlurb.ts`) adds gated optional lines — put-up Sport→Trad→Boulder with community-others impact, home crag, partners, season, solo, projects, hardest, popularity, travel, rock. Cap ~3 optional paragraphs; docs at `/docs/climbing-story`. |
| 2026-10 | #179 / #185: minimal glibc runtime removes mount/apt/shell utilities. CI builds and smoke-tests amd64 + arm64; local importer validation uses synthetic loopback data and GitHub TLS, never theCrag. Residual OS inventory (14 deps / 25 IDs on v0.6.3), CVE-2026-85091 zlib triage (literal range excludes Debian 1.3.1, but trixie is still tracked vulnerable; we cite runtime non-reachability, not "not affected"), and base-update rescan steps live in `docs/dev/DOCKER_SECURITY.md` — no scanner ignores. |

| 2026-10 | #172: logbook `tagExact=Category:Name` (repeat for AND) exact-matches structured tags in `tags_json`; `tag=` substring and `rock=` unchanged. Shared helpers in `#lib/routeTags`. |

| 2026-10 | #197: route-history import stores the full last `/api/route` object on `routes.route_api_json` (migration `0015`) and keeps each history item’s original JSON in `route_history.raw_json`. Logbook sync already retains full ascent/account payloads in `ascents.raw_json` / `profiles.raw_json`. Column caches stay for UI; dig into raw JSON for future fields without a paced re-fetch. |

| 2026-10 | #189: community-row `styleLabel` is display-only (explicit gear style beats bolts); `sportOrBolted` still drives the sport/bolted tile and community badges. |
| 2026-10 | #196: badges for Christmas Day (`12-25`), New Year (`12-31` or `01-01`, one badge), and 250 m summed height in one calendar day. Any logged ascent counts for holidays (attempts included). Keep existing `height_10km` / Ten K Vertical — no duplicate overall 10 km badge. |

| 2026-10 | #194: FA/FFA milestones condense to thresholds (first FA/FFA, FFA counts 5–100, combined FA+FFA 5–100, style FA 10/20/50 for Sport/Trad/Boulder). Badges align (`fa_20`/`fa_50`/`fa_100`, `ffa_*`, `fa_{sport,trad,boulder}_*`). Stable ids like `fa:first` / `ffa:5` / `fa:boulder:10` — no per-route `fa:{routeId}`. |

| 2026-10 | #201: opt-in `ROUTE_DATA_REFRESH_DAYS=30` or `90` reuses post-sync imports; new routes first, then oldest stale fetches (including missing). Unset/0 keeps fetch-once. The shared 100-route cap, pacing, back-off and manual mark protections remain. |
| 2026-10 | `ROUTE_DATA_REFRESH_DAYS` accepts whole digits 30–3650 (e.g. 180 ≈ half a year); under 30, over 3650, or non-digits still mean fetch-once. |

| 2026-10 | #195: Grade goal progress uses pyramid readiness (`gradeGoalReadiness`: ~2 distinct-route sends at N−1, ~4 at N−2; capped below 100% until a send at N), not linear best/target. Height/days stay linear. `/docs/goals` explains the model; dashboard + Goals page link “How it works”. |
| 2026-10 | #226: Grade readiness also fills from non-send ticks at ≥ N−1 (up to ~+20%), with horizon-scaled soft needs (short ~15 / medium ~35 / long-haul ~75). Still capped at 95% without a send at N. |

| 2026-10 | #209: `data:0004_invalidate_incomplete_route_cache` deletes `status='ok'` `route_history_fetches` rows for routes missing post-0012/0015 cache evidence (`route_info_updated_at` or `route_api_json` null) so upgrades re-queue imports without manual Refresh all. Leaves `missing` rows alone. Future route-info SQL/data migrations must follow the same invalidation pattern (`docs/dev/ROUTE_HISTORY.md`). |
| 2026-10 | CSV AU boulder grades: bare digits + Australia (Country / Crag Path / australia URL) pass `gradeSystem: 'AU'` in `csv.ts` so Upendi `9` → VB (not fake V9); explicit `V…` stays V-scale (#124). `repairGradesFromRawJson` remaps flat CSV `raw_json`; `data:0003_csv_au_boulder_grades` repairs existing DBs. |

| 2026-10 | #214 review: cached CSV grade repair changes grade columns only, preserving API-only metadata. Inferred AU ascent overlays cannot override explicit V route grades. |

| 2026-10 | #219: Logbook sync stays in user `/docs` (`docs/guide/logbook-sync.md`); README/DEPLOY cross-link it; household-key detail stays in `docs/dev/ROUTE_HISTORY.md` via GitHub URL from the guide. |

| 2026-10 | #224: Settings no longer offers a First Moves date control. The first successful non-empty sync/import always stamps `first_import` when `at` is still null (legacy “unknown until owner corrects” path removed). |

| 2026-10 | Security remediation pins pnpm patches for deepmerge 4.3.1, picomatch 4.0.7 and uri-js 4.4.1, with installed-package exploit regressions in `dependencySecurity.test.ts`. Keep `patches/` available before Docker's frozen install. Adapter-node is build-only. Read `patches/README.md` and `docs/dev/SECURITY_SCAN.md`; version-based alerts can persist despite local fixes and must remain disclosed. |

| 2026-10 | #268 / #277 / #281: opt-in `WEATHER_IMPORT` caches outdoor Open-Meteo days (`weather_days`, migration 0017, incl. wind km/h), post-sync paced fetch, Settings status/action, heat/freeze/rain/snow/wind badges. Conditions-vs-performance analytics later landed in #365. |
| 2026-10 | Weather follow-up: Settings fetch is background (avoid ~55s proxy timeouts); pending queue is oldest-day-first; badge eval skips indoor via `isLikelyIndoorRoute` + `cragName` on extra rows. |
| 2026-10 | `extractLatLon` accepts theCrag TLC bare `[lon, lat]` geometry arrays (not only GeoJSON Points). `data:0005_repair_tlc_bare_geometry_coords` re-maps cached logbook `raw_json` so weather import can queue outdoor days. |

- First ascents attribution follows saved mark source (plus cached setter credits), not `ROUTE_HISTORY_IMPORT`: manual/imported credits coexist and imported marks survive disabling import.

- Node 26 LTS is the runtime baseline. Install the exact `packageManager` with npm (Corepack is not bundled); the distroless image also needs the build-stage libatomic shared library. Validate native SQLite and importer on amd64 and arm64 after runtime updates.

- #325: proportionate local checks by change type (table above); cached `pnpm lint`; `test:related` / `test:changed`; CI splits `check` and `e2e` jobs, cancels superseded PR runs, caches Playwright browsers. Feature e2e specs run once and scan both themes via `e2e/axe.ts`. Evidence and inventory in `docs/dev/TESTING.md`.
- #325 follow-up: CI budgets come from medians of ≥5 green runs, recorded in `docs/dev/TESTING.md`. They were re-based from 16 runs after #370 to `check` ≤ 85 s, unit ≤ 25 s and E2E step ≤ 170 s. GitHub runners fall into a fast and a slow group (E2E 98–121 s vs 150–166 s on the same suite), so never judge a change by a single run. E2E sharding (#378) closed with five-run medians: slower shard 140 s ≤ arm64 170 s (was 187 s vs 169 s unsharded). Feature axe scans are scoped; no spec loops its flow per theme. `wipeAllData` lives in `src/lib/server/wipe.ts` (re-exported by `analytics.ts`); tests that only need a clean DB import it from there to skip the analytics graph.
- #378 close-out: post-sharding five-run table in `docs/dev/TESTING.md` (_After #378_); slower-shard median at or below arm64. Sample empty-commit PRs were timing-only and not merged.

_Add a row when you change behaviour agents must know about._

- CSV weather (#352): route API ancestors are arrays (`isTLC`, `parentID`), while logbook ancestors are keyed. Normalize via `areaAncestors.ts`, excluding administrative subTypes. Opted-in route imports use remaining requests in their existing ten-request budget for area locations when weather is enabled. `weather_area_cache` (0019) is provider/area scoped, includes negative answers, obeys route refresh age, and is cleared/cancelled by Wipe. Existing route caches queue missing area checks without a history reset. Never overwrite authoritative route coordinates or use the enrichment key to sync another logbook. Location signatures include referenced area payloads; raw caches stay server-only.

- Area location verification (#352): `/api/area/ids?show=info,location` can return an envelope with scalar `geometry.lat` / `geometry.long`. Use those supplied coordinates as an area point, not a calculated centre or guessed boundary/point-array adapter. Sanitized shape evidence is in `fixtures/area-location.sanitized.json` with provenance notes. Resolver signature v4 invalidates earlier unresolved envelope caches. Credential access was checked with a read-only request; automated tests stay offline.

- Settings CSV import keeps the file picker and submit action stacked and left-aligned; avoid a growing file input that pushes the action to the card's far edge.
- Route-history status exposes `retryAt` from the existing minimum run interval and upstream back-off. Settings counts down from server time and enables the action when due; retain the server pacing guards.
- Sessions per week card: a session is a calendar day with ≥1 ascent; ISO weeks (Mon start); helpers in `#lib/sessionsPerWeek` (shared, not server-only).
- Weekday card (`#lib/weekdayStats`): Mon–Sun donut (UTC day from `YYYY-MM-DD`); Sessions|Ascents × All|Sport|Trad|Boulder × All time|Last 12 weeks (`cs_weekday_*`); default half left of Sessions per week under Monthly/Yearly; hide when no sessions.
- Training load detail lives at `/training-load` (26-week + daily28); the dashboard card title links there and still shows 12 weeks.
- Default dashboard layout pairs Recent activities (left) with Climbing story (right) after climber type; then Badges | Climber profile, Streaks | Eddington, First ascents | Hardest sends; saved Customize cookies keep their order.
- Default dashboard places Milestones (half, capped list + Show more → `/milestones`) beside Training load; saved Customize cookies keep their order.
- Ascent calendar fills the card width; `--heat-1..4` is green→yellow→orange→red (Dreeve-like intensity), not theCrag grade-band greens.
- **New route?** on projects covers blank/`Project` grades and wide provisional spans (`21-23`, `V1-3`); adjacent half-grades (`V1/2`) stay ordinary. Midpoint chips still show when parsed.
- Weather conditions card (`weatherConditions`, #272): half-width after Milestones, hidden (`stats.weatherConditions == null`) until ≥1 outdoor day has an ok `weather_days` row. A "day" is a location-day (rounded lat/lon + date); likely-indoor routes never count (`DashboardExtraRow.outdoor`). Pure builder `#lib/weatherStats`. Reuse `lookupAscentWeather` / `weatherAscentDay` / `matchesWeatherFilter` from `#lib/weatherKeys` for any ascent→weather surface; format calendar days with `formatCalendarDate`.
- Weather & performance (#365): pure `#lib/weatherPerformance` builds `stats.weatherPerformance` (half card after Weather conditions; null hides it with no cache, `ready: false` below 20 location-days). Base = outdoor `isSend || isAttempt` rows with a cached `ascentWeatherKey`; rates (send rate, near-limit vs the same style+scale's hardest outdoor send in the prior 365 days, onsight/flash share) are compared band-vs-other-days with a cluster-robust z (location-day clusters, |z| ≥ 1.96, ≥ 5 days each side). Show rates only at ≥ 10 ascents over ≥ 3 days. Always label as correlation; `DashboardExtraRow.isAttempt` carries the attempt flag.
- Logbook weather (#273): `?weather=heat|freeze|rain|snow|fair` and owner-only `?missing=weather` via `logbookWeather.ts` (outdoor rule = `isLikelyIndoorRoute`; indoor never matches). `listLogbook` rows carry `weatherChips` (`weatherChips()` in `#lib/weatherKeys`, rendered by `WeatherChips.svelte`) and `weatherAvailable`; hide weather UI when the cache is empty.
- Recent activities (#274): `stats.recent[].weatherChips` come from `logbookRowWeatherChips` (same lookup as the logbook); the strip renders only for outdoor climbs with a cached day.
- Climbing story weather (#275): `describeWeatherPersonality` in `climberBlurb.ts` takes the #272 `WeatherConditionsView` and adds at most one gated line (≥20 weather days, ≥50% of outdoor days covered); positive wording only. Docs: `/docs/climbing-story` + `/docs/weather`.
- Ascent calendar Weather mode (#276): `HeatmapDay.weather` (`CalendarWeather`, lowest-id outdoor ascent with a cache hit) colours cells via `--weather-*` tokens; the mode button appears only when any day has weather and falls back to Intensity otherwise. A values table duplicates the data for screen readers. `--weather-mild` is amber/yellow (`#eab308` / `#facc15`), not slate grey — muted grey is reserved for "no weather data" (`.attempt`).
- Sectors climate (#278): `CragSectorGroup.visitClimate` from `listVisitClimateByCrag()` (`sectors.ts`) via `buildVisitClimate` (`#lib/visitClimate`): distinct outdoor location-days with cached weather per crag, shown only at ≥5 days, always labelled as visit-day weather, not climate normals.
- Fair-weather metric (#280): `WeatherConditionsView.fairWeather` (`buildFairWeatherMetric` in `#lib/weatherStats`) needs ≥20 weather days; fair = `isFairWeather`, tough = heat/freeze/rain/snow/wind. Labels (fair-leaning ≥60% fair, all-weather ≥50% tough, else mixed) are descriptive, never a score.
- Badges #279: `partners_crowded_belay` (3+ distinct partners), `multipitch_day` (3+ sent pitches/day via pitch labels or `pitchesTotal`), `travel_week` (4 outdoor crags in 7 days; `DashboardExtraRow.cragName`), `route_persistence` (first send after 4+ days on the route). Stable ids, one-shot (not in Almost there), neutral wording.
- Partners page (`/partners`, #269): Ascents | Sessions | Areas metric toggle (`cs_partners_metric`); helpers in `#lib/partnerStats`. Dashboard card shares the selected metric and limits the ranked full list to seven. Docs at `/docs/partners`.

- Weather PR review: preserve main’s indoor badge guards and shared partner statistics when updating the weather stack. Fair weather requires measured precipitation below 0.1 mm; missing rain is unknown, not dry.

- Fair/tough weather groups overlap on mild dry days with strong wind or freezing lows. At ≥50% tough days, use the all-weather label before considering the fair-leaning threshold.

- Multipitch badges deduplicate pitch ranges/lists and whole-route logs per route/day. Cached API per-pitch send ticks override summary labels; raw ascent JSON stays server-side.
- Shared weather ascent days reject impossible dates by a UTC round-trip (including non-leap February 29), so coverage and backlog match real calendar days.

- The weather backlog uses all checked cache keys, including unavailable (`missing`) rows, just like the importer. Usable weather lookups still include `ok` rows only.

- Ascent calendar day iteration and weekdays use UTC throughout; local noon can fall on the prior UTC date in UTC+13/+14 browsers. Test Pacific/Kiritimati and America/New_York.

- Apply fair-weather label thresholds to exact shares, before rounding rates for display.

- Accessibility regressions #300–#302: small tinted count/status pills use ink text; interactive crag SVGs use a named group and individually named links. Weather fixtures audit full dashboard/logbook/sectors pages in both themes.

World map (#313): `/map` uses bundled public-domain Natural Earth outlines, server-side ascent/place aggregation, native marker controls and a values table. Glowing markers use ascent counts; glow is the only display style, with no mode toggle. Stable `place` identity and `mapVenue` filters must survive logbook sort/page/form navigation. Shortest longitude arc and circular means prevent dateline splits; no third-party map requests or private notes.

- Weather drill-downs (#307): the Weather conditions card links each condition row and entire daily-high bar to the logbook. Temperature ranges use `weatherHighMin` (inclusive) and `weatherHighMax` (exclusive), in Celsius, and persist through filtering, sorting and pagination. Card counts are outdoor location-days; the logbook shows every matching ascent, so counts can differ. The logbook Weather column shows cached daily high/low and precipitation plus notable condition chips on screens at least 1280px wide; smaller screens hide its header and cells and show the condition chips in the route cell instead. Indoor or uncached rows show a dash. No weather requests are made while viewing pages.

- Weather locations (#309): `weatherLocations.ts` caches weather-only route/sector/TLC point provenance in `weather_locations` (0018), rejecting known country-only/arbitrary ancestor and unsupported geometry. `/settings/weather-locations` lets owners select a cached Open-Meteo/GeoNames settlement with name + country context; no automatic first-result choice. Overrides are per provider area/route, never stored in route coordinates. Settlement weather is marked approximate and excluded from weather badges. Use `attachWeatherLocation` + `ascentWeatherKey` on every weather surface; null means unresolved and must not fall back to legacy coordinates. Wipe cancels searches and clears all three new tables. Per the owner’s subsequent request to enable polygons, validated explicitly typed GeoJSON area geometry is now supported; undocumented Fence/untyped array adapters still require a sanitized real provider fixture.

- Sun-facing badge (#283): verified route exposure tags win; only when no route sun/aspect metadata exists may `source: parent` fill in. Mapping must match the inherited tag ancestor ID to `route.ancestors.parent.id`, rejecting known country/continent/state/region sources. Higher/unknown ancestors and legacy tags never supply exposure. At the chosen level, Always shady vetoes, All day sun qualifies, else equator-facing Aspect is required; partial-day sun alone is insufficient. Preserve source `route|parent|ancestor` on Aspect/Weather tags. Append-only data migrations 0006/0007/0008 repair cached provenance without fetches. Keep outdoor, local-summer, 25≤|lat|<60 and reliable route/sector/crag-location guards; town/unknown-precision locations stay excluded. One-shot seasonal heuristic, no Almost there. Sanitized evidence lives in `providers/thecrag/fixtures/`.

- Weather location precedence compares both cached logbook and route API payloads: route point beats crag point, then sector point, then validated area polygon, regardless of which cache supplied it.
- Polygon preparation (#309): `weatherPolygon.ts` is a bounded, GeoJSON-only first-boundary-coordinate helper, now wired into the weather resolver at the owner’s explicit request. Tests are synthetic, not captured provider evidence. Only identified parent/TLC nodes with typed Polygon/MultiPolygon geometry qualify; no guessed Fence adapters. Persist source `polygon`, exclude it from weather/sun-facing badges, and version location signatures when resolver policy changes. Limits are in `docs/dev/WEATHER_POLYGONS.md`; follow-up #344 is closed. Add an observed-format adapter only with a sanitized real-provider fixture (synthetic tests never justify one). Do not reopen #309 for that.
- Greenpoint (#303): one-shot green badge for a sent `greenpoint`, `greenpointonsight` or `greenpointflash` tick (spacing/hyphens normalized), or an original Sport route with ascent protection recorded as Trad and a confident clean lead (onsight, flash, red/pink point, ground-up redpoint or an explicit successful Lead tick). Generic Tick/Send/Clean, attempts, top-rope and seconding do not establish a lead for the inferred path. Route and ascent styles stay separate. This badge has no Almost there counter and sits after Persistence Pays in `BADGE_CATALOG`. Provider tick IDs are documented in [theCrag API](https://www.thecrag.com/en/article/api) and [tick types](https://www.thecrag.com/en/article/ticktypes); tests are synthetic representations of those documented IDs, not captured private payloads.

- Partner dashboard aggregation uses `listPartners` and its left join, matching `/partners` even for legacy missing-route ascents. Keep other dashboard analytics on their intentional route join.

- Partner Areas prefer provider-scoped `routes.area_external_id`, then normalized names. Name-only rows resolve to an id only when the cached name/id association is unique. No provider fetch needed.

- Session/day analytics share `#lib/calendarDay`: strict UTC date round-trip, rejecting placeholders, impossible dates and unknown year 0000. Keep timestamps on their written calendar date; never shift into the server time zone.

- Card display preferences (#296) use whitelisted cookies for SSR; legacy localStorage choices migrate on mount. The pre-paint script in `app.html` sets `html[data-card-prefs-migrating]` only when a whitelisted key exists in localStorage without its cookie, and only then do cookie-less cards reserve their layout (hidden) until migration completes. New visitors and no-JS clients see default cards immediately. Keep the key list in `app.html` in sync with `CARD_PREFERENCE_KEYS`. Cookie and storage failures remain nonfatal.

- Dashboard Partners (#298) shares the Ascents/Sessions/Areas preference with the Partners page. Rank the full partner set by the chosen metric before applying the dashboard seven-row limit; keep the title link to the full leaderboard. Compact toggle buttons wrap within quarter-width cards.

- Projects (#326): open requires two valid calendar days; completed requires work before the first send across two days or two unsuccessful tries on its day. Send numberAttempts includes the successful try; use max with separate failed rows to avoid double-counting. Known same-day timestamps exclude post-send work; date-only send ties use ascent IDs, while date-only failed rows on the send day remain ambiguous pre-send work. Project cards/dashboard validate session days with calendarDay too. Startup data migration 0010 rebuilds the cache after the shipped solo repair 0009. Keep small project status text on --ink for contrast in both themes.
- Recently sent projects: past six calendar months in UTC, clamped at month ends; date-only sends include the boundary day, timestamps preserve its clock, future days are excluded. Keep `isTouchedWithin` and its stale-open-project policy unchanged.

- Rope-solo milestones (#319): `#lib/soloTicks` normalizes only explicit known lead/top-rope/aid solo ticks; provider completion classification and `soloKind` share it. First lead/top-rope badges additionally require a send and strict valid day; never infer them from missing partners or route style. One-shot stable IDs `first_lead_rope_solo` / `first_top_rope_solo`, no Almost there. Data migration 0009 repairs completion flags only with matching cached provider tick evidence, preserving route metadata, styles and notes; 0006–0008 belong to #318.

- Sync summaries (#335): aggregate actual upsert insert counts across API pages; CSV returns its transaction's counts. Settings shows successful processed/new/refreshed ascent, new route and prune counts, with neutral skipped-run feedback. Refreshed is not changed. Do not use before/after net totals or include private payloads. Manual CSV upload is upsert-only; weather/history are separate background work. No summary is persisted.

- Seasonality search (#331) at `/seasonality` uses cached logged-route curves only. Ranking is selected-month / annual-peak (no cutoff); zero curves have no signal. Share `weightedSeasonality` with Best months, keep provider area identities separate, preserve URL filters, and use exact `/logbook?route=<local id>` links rather than name search. No provider fetch on view/search.

- Recent activities (#333): order by valid written climbing day descending, then provider logDate instant descending, then stored ascent ID descending. Missing/invalid log times follow known times; unzoned log clocks default to UTC. Never use epoch/updated_at (edits/sync) as log creation time. Sort the full set before the twenty-row limit, and keep the displayed ascent date unchanged.

- Solo card drill-down uses `/logbook?solo=toprope|lead|free|dws|aid` and shared `#lib/soloKind` classification (explicit tick wins over ascent style). Preserve the filter through sort/page/form navigation; hardest-send links remain separate.

- #353: the route import flag is `ROUTE_DATA_IMPORT` (Settings → **Import route data**); `ROUTE_HISTORY_IMPORT` is ignored with no fallback. Older notes above that name `ROUTE_HISTORY_IMPORT` mean this flag. Tables, migrations, module names and pacing are unchanged.

- Daily streak records/badges (#339) share `#lib/dayStreaks`: unique strict written calendar days, UTC adjacency, earliest longest-run tie. Card exposes longestStartDate/longestEndDate and formats them as calendar dates. One-shot streak_days_7/10/30 badges use the first threshold-reaching day, include attempts/indoor climbs and have no Almost there counter. Do not infer streaks from log timestamps.
- Streaks card (#387): 2×2 tiles (days/weeks/months/longest); footer has record range, last ascent, days-since-last when the day streak is 0, and lifetime `activeDays`; title links to `/docs/activity`.
- Rock & performance (#388): `#lib/rockPerformance` compares send rate / near-limit / onsight-flash by Rock type tag (cluster = rock+day); hidden until a tagged send/attempt exists; rates after ≥20 tagged days; top rocks + Other; `/docs/rock-types`.

- Open-Meteo archive client reads the body as text and parses it safely: non-JSON or `{error:true}` bodies (even on 2xx) are failures, never cached days. A 429 status or rate-limit wording counts as `429` (blocked back-off, honours Retry-After). Other bad 2xx bodies are reported as `502` (error back-off). Messages quote one trimmed line from the provider, never a raw `JSON.parse` error.

- Earned badge order (dashboard rail + `/badges`) comes from `sortEarnedBadges` (`#lib/badgeOrder`): newest earning-climb day first, catalog order within a day, then badges without a climb day (First Moves import time, community estimates). Don't sort by raw `date` strings — First Moves' import timestamp would pin it first.

- Card help links: use `HelpLink.svelte` (round "?" beside the card title, named by `label`) rather than inline "About …" text links. Climber profile and Grade bands use it.
- Height badges: `HEIGHT_BADGES` covers 1/5/10/20/50/100/150 km (`height_*km`, Almost there included); keep one id per threshold.

- Settings live import progress: while route-data or weather `running` is true, Settings polls `GET /settings/import-status` (local counts only, `no-store`, gated with `/settings`) every 2.5 s skips ticks while the tab is hidden and stops once both are idle. `freshestSnapshot` (`#lib/importProgress`) lets a newer page reload win over an older poll; the retry countdown anchors to the chosen snapshot's `serverNow`. Never make the endpoint trigger a run or contact a provider.

- Partner context (#349): `ascentPartners` formats case-insensitive distinct upstream names. Badge details (including day/cumulative achievements) refer only to the linked qualifying ascent. Hardest/notable/recent cards and grade/FA milestones retain that ascent attribution; never infer companions from private notes or route-level aggregates.

- Offline (#348): service worker caches only build assets, a data-free `/offline` shell and an explicit field-whitelisted public snapshot. Never add SSR/data-response runtime caching. Whole-app protection disables downloads. Navigations fall back to the shell only on network failure or 502/503/504 (30 s timeout), never on app errors. Any mutation/logout clears this browser; wipe rotates `offline_revision` for other browsers on reconnect. Seven-day expiry, 5,000 newest rows, 10 MB; updates clear old build caches.

- Rock performance aggregate bands use a separate ID namespace from real rock tags, including a real tag named Other; only the aggregate has no drill-down link.
- Weather details (#389): `/weather` reuses the conditions/performance builders through `server/weatherPage.ts`; dashboard cards default to compact summaries (`compact=false` renders detail). Performance URL state uses `group` / `measure`; preserve thresholds and saved dashboard card IDs. Coverage distinguishes resolved location-days from unresolved ascent counts, checked-unavailable and unchecked days. Import/location controls stay in Settings; page reads cached data only.

- Minimatch security override (#11): v10-range ESLint tooling uses verified v11.0.4 APIs; keep the bounded installed-package regression and remove the override once callers adopt an upstream fixed release. Deepmerge alert #10 is covered by the existing pnpm patch; its unchanged upstream version remains flagged, with #174 tracking removal.

- Current day streak (#398) uses currentDayStreak with strict written dates and UTC adjacency; today or yesterday anchors it, and future logs cannot extend it. Keep timezone/DST regressions alongside historical streak tests.

- Current week/month streaks (#399) share currentPeriodStreak: anchor to the current or immediately preceding period, ignore future days, and expire after a whole empty period. Weeks start Monday; integer UTC week indices handle ISO week 53 without guessing 52-week years.

- Performance baseline (#400): performanceBaseline owns effective scores, style/scale keys and the prior-365-day range maximum (lower edge included, ascent day excluded). Callers supply reference eligibility: weather excludes indoor, rock includes untagged sends. Build once per view; indexed queries avoid full historical scans per ascent.

- Climbing story put-up links: preserve plain-text paragraphs for metadata, with a separate typed route-name span rendered as a native escaped anchor. Mega-classic counts use the paired community-others estimate and the display locale; cached links must be HTTPS theCrag route pages, with a numeric provider-ID fallback.

- Dashboard weather performance falls back to detail when the default daily-high/send-rate comparison has no signal. Keep that decision independent of local fallback controls, so selecting another measure does not collapse the card. Detail-page controls remain URL-backed.

- Settings has one navigation entry in the top-right header, with no duplicate sidebar/drawer link. Keep Settings route title/breadcrumb resolution independent of the sidebar groups.

- Recent activity styleLabels come from the shared logbookStyleLabels helper, preserving route discipline, ascent protection and explicit solo ticks. Render existing StyleBadge components in a wrapping group; never infer solo from absent partners.

- Seasonality browser history (#403): wait for exact sort/filter state before navigating back. Capture the route-results URL and stop there within a bounded history walk, then assert route view/month/search before pagination; fixed blind back counts can overshoot into the crag list.

- Automatic CSV sync removed at theCrag's request: no website login, export download, `THECRAG_SYNC_MODE=csv`, or `thecrag_web_sessions` (dropped by 0021). Manual CSV upload remains; leftover CSV env vars are simply ignored.
- Repeats vs new routes (`routeRepeats`): pure `#lib/routeRepeats` classifies every dated ascent as a first visit (the route's first logged day, from the whole history) or a repeat (a later day), keyed by `provider:externalId` via `routeRepeatKey`, never by name. Half card after Route popularity, hidden below 20 dated ascents; All time | Last 12 months (365 days) × All | Sport | Trad | Boulder (`cs_repeats_*`). Labels apply to exact shares at ≥20 ascents: Explorer ≥75% new, Repeat climber ≥50% repeats, else A bit of both. Badges `distinct_routes_{50,100,250,500}` (Explorer…Guidebook Explorer), `route_days_10` (Old Faithful) and `home_turf_25` (25 repeat ascents at one crag name) use `DashboardExtraRow.routeKey` and appear in Almost there. Docs: `/docs/repeats`, `/docs/badges`.

- Map & sectors share `/map`; `/sectors` permanently redirects with query parameters to `/map#sectors`. The sector hierarchy is explicitly all-time, independent of map filters. Exclude the exact normalized upstream "To be deleted" holding-area name from map places and sectors, preserving its logbook ascents as unmapped. Failed worker preloads/data fetches return an uncached plain-text 503, never offline HTML.

- theCrag grade score (#441, #444, #445): theCrag scores every grade in every system on one scale (`POST /api/grade` `score` = logbook ascent `gradeScore`; each band spans 100 points). `src/lib/grades/thecragGradeScores.ts` holds captured AU, French, YDS, Font, and V ladders; `thecragScale.ts` interpolates between them. API ascents with a `gradeScore` use it before grade text (`gradeFromTheCragScore`), and the route takes that score only when its grade text equals the ascent's. French/YDS/Font parsing and labels come from the same ladders, so CSV text and API scores agree. Ascent `grade` text can be in another system than `gradeSystem` (e.g. `YDS` with `17`), so never trust the pair over the score. Re-capture ladders only with a few paced API-key requests, never website sessions. Rewind labels format through `formatGradeLabel` (#442).
