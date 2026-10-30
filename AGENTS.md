# AGENTS.md — Crag Stats

> **Living document.** Future AI agents (and humans) should read this before changing the repo, and **update it** when they learn something new, correct a mistake, or retire outdated guidance. Prefer short, actionable notes over essays. Remove stale info rather than commenting it out.

Self-hosted climbing analytics for [theCrag](https://www.thecrag.com/), inspired by [Dreeve](https://dreeve.app/) (Stats for Strava) and [RoxClimbs](https://roxclimbs.com/). MIT licensed.

---

## Product principles

1. **Upstream is source of truth.** Like Dreeve ↔ Strava: theCrag owns the logbook. Local SQLite is a cache + analytics store.
   - API sync **upserts** creates/updates (comments, grades, ticks, heights, etc.).
   - API sync **deletes** local ascents that no longer exist upstream, then orphans routes/projects.
   - Do **not** invent a second editable logbook that drifts from theCrag.
   - CSV sync upserts then prunes missing IDs (export as source of truth), but refuses the run on an empty export vs a non-empty cache or a >50% drop when local ≥ 100 ascents (`csvPruneGuard.ts`). Prefer API sync when the user has a supporter key.
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
  sync.ts                # runTheCragSync (API full pull + prune, or opt-in CSV mode)
  csvLogbookSync.ts      # opt-in CSV logbook download + upsert + guarded prune (#217)
  csvPruneGuard.ts       # empty-export / massive-drop refusal before CSV writes
  theCragWebSession.ts   # AES-GCM encrypted cookie store (thecrag_web_sessions, 0016)
  sessionSecret.ts       # rejects placeholder SESSION_SECRET for CSV mode
  routeHistoryEngine.ts  # opt-in FA/FFA route-history import: cache, pacing, marks (#68)
  routeHistoryImport.ts  # env + impers wiring, background trigger after sync
  providers/thecrag/     # API + CSV + logbookSession (CSV download) + routeHistoryApi/Parse
  db/schema.ts
migrations/              # 0001_init.sql, … 0016_thecrag_web_session.sql
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

Cursor/`maxEpoch` is still stored for diagnostics; it is **not** used to skip a full pull.

### Opt-in CSV mode (`THECRAG_SYNC_MODE=csv`)

For owners without a supporter API key. The default is `api`; any value other than `api`/`csv` is invalid and sync refuses to run.

- **Env:** `THECRAG_USERNAME` (username, not email), `THECRAG_PASSWORD` and `SESSION_SECRET`. `getTheCragSyncConfiguration()` reports CSV mode as unconfigured unless all three are set **and** `SESSION_SECRET` passes `isUsableSessionSecret()` (16+ characters, not a placeholder such as the `.env.example` value or the `dev-insecure-session-secret` fallback). Credentials stay in the environment; never store the password in the DB.
- **Flow** (`providers/thecrag/logbookSession.ts`, `csvLogbookSync.ts`): try the CSV export with saved cookies; if the session expired, fetch the login page, read the hidden CSRF fields, sign in once, download the export and retry once. Uses `impers` (browser impersonation) at the owner's own risk.
- **Cookie store:** `thecrag_web_sessions` (migration 0016) holds AES-256-GCM encrypted cookies keyed by a hash of the username, with the key derived from `SESSION_SECRET` (AAD = account key). Rotating `SESSION_SECRET` only forces a new login. `next_allowed_at` / `failures` persist so pacing and back-off survive restarts. Wiping data must clear it and invalidate in-flight syncs (`syncGeneration`).
- **Semantics:** CSV upserts then calls `reconcileProviderAscents` so missing export IDs are deleted (orphans cleaned like API). Guards in `csvPruneGuard.ts` refuse the whole sync (no writes) on an empty export vs local data, or when local ≥ 100 and the export keeps under 50% of that count. API-only fields (pitches, partners, quality, route info) are still absent. A configured username that differs from the saved profile login aborts before any request, so accounts never mix.
- User docs: `docs/guide/logbook-sync.md` (also `/docs/logbook-sync` in the app; keep it in `DOC_PAGES` — Settings links here). Deep `impers` / household-key notes stay in `docs/dev/ROUTE_HISTORY.md` with a GitHub URL from the guide.

Height quirk: theCrag may return height as `[value, unit]` arrays — parse in the API mapper (`parseHeightMeters` / array handler).

---

## Grades & colours

- Canonical numeric scores lean on **Ewbank** for routes and **V-scale** for boulder; convert for display via `src/lib/grades`.
- Band palette (Beginner → Elite) matches theCrag article colours — see `bands.ts`. Boulder: VB± green, **V0± yellow** (Intermediate), V1–V4 orange, V5–V10 red, V11+ purple (`bandFromVScale`).
- Preferred system: site-wide `app_settings.grade_system` (Settings → Display & visibility), default Ewbank when unset. `?system=` is a one-off override; the old `cs_grade_system` cookie is no longer read.
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

- **Ungraded routes = likely projects.** theCrag's API has no project flag. Ungraded routes come back with `grade: null`, `gradeBand: 0`. `isUngradedRoute()` (`projects.ts`) also accepts a literal "Project"/"Proj" grade, and project cards show `NewRouteBadge` ("New route?"). In training load, `isUngradedWork()` treats an unsent tick with no grade at all (route or your own) as at your 12-month max; ungraded sends stay at 0.3.
- **Climber type:** if one of Sport / Trad / Boulder is ≥ **40%** of ascents → “Sport climber” (etc.); else “Rock climber”.
- **CPR timelines:** approximate model in `cpr.ts` (power factor P=5, tick shifts, ~0.7 grade/year decay). Link/docs: theCrag CPR articles. Label UI as approximate — not a byte-for-byte clone.
- **Notable ascents:** by style + by area; use `StyleBadge` + `TickTypeIcon` (theCrag-like SVGs).
- **First ascents:** theCrag has no FA tick type; FAs live in route history, which the logbook API doesn't return. The owner marks FA/FFA in the logbook (`first_ascents`, 0009). Optionally (`ROUTE_HISTORY_IMPORT=true`, **off by default**) `routeHistoryEngine.ts` imports public history in the background after each sync: each route **once** by default (`route_history_fetches`), or opt-in rolling refresh via `ROUTE_DATA_REFRESH_DAYS` (whole days ≥ 30, e.g. 90 or 180), **100 routes per run**, ≥1.1 s between requests, one `impers` session per run, stop + back off (≥24 h, honours Retry-After) on any block. Auto-marks only on an exact `@login` match and never overrides manual marks/unmarks. Details: `docs/dev/ROUTE_HISTORY.md`. Mark/unmark and import actions require `locals.authed`.
- Summary metrics: onsights, successful ascents, distance climbed (km).

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

- **Tokens only.** Colours come from `src/app.css` (`--bg`, `--paper`, `--surface-2/3`, `--ink`, `--ink-muted`, `--line`, `--accent` rope orange, `--accent-soft`, `--shadow`). Don't hard-code `white`/`#fff` surfaces or ink-tinted `rgba()` — they break dark mode. Use `color-mix(in srgb, var(--ink) N%, transparent)` for tints. `color: #fff` on an accent/coloured fill is fine.
- SVG presentation attributes can't take `var()` reliably — use `style="stroke: var(--ink)"` instead.
- **Dark mode:** OS preference by default; header toggle stores `cs_theme` in localStorage → `html[data-theme]`. Applied pre-paint by the inline script in `app.html`.
- **Shell (Dreeve-style):** fixed top bar (sidebar toggle, logo, GitHub, theme, settings, log out when signed in) + grouped icon sidebar with count badges (`navCounts` from `+layout.server.ts`, hidden when `AUTH_SCOPE=all` and logged out). Desktop toggle collapses to a mini icon rail with hover tooltips (`cs_sidebar=mini` → `html[data-sidebar='mini']`); ≤860px it's an off-canvas drawer.
- Icons: `NavIcon.svelte` (inline outline SVGs). Logo/favicon: `src/lib/assets/favicon.svg` (flat orange crag, grade bars masked out / transparent through the base — no circle, no gradient). Wordmark lockup is always ink "Crag" + orange "Stats".
- Full style guide (tokens, logo, theCrag band + discipline colours, shell): **`docs/dev/BRANDING.md`** — update it with any visual change.

## In-app docs (/docs)

- User-facing explanations live in **`docs/guide/<slug>.md`** and are rendered at `/docs/<slug>` (bundled at build time via `import.meta.glob`, rendered with `marked`). Order/titles come from `DOC_PAGES` in `src/lib/docs.ts`; add new pages there.
- `<!-- component:name -->` markers embed generated tables from `DocBlock.svelte` (grade bands, conversions, tick types) so docs never drift from code. `docs.test.ts` checks tick-type send/attempt labels against `classifyTick()`.
- **When you change an analytic (climber type, CPR, training load, grades), update its doc page in the same PR.** Dashboard cards link to their page ("How it works").
- Paraphrase theCrag articles and link the source; don't paste their text.

## Docker / release

- Compose: `docker-compose.yml` (build) and `docker-compose.ghcr.yml` (pull image).
- `docker-release.yml` builds multi-arch and pushes on version tag pushes (`v0.1.0`, …), manual dispatch, or `workflow_call`. There is no `release` trigger: `gh release create` (or a UI release with a new tag) pushes the tag, and a second trigger built every release twice (#164). Publishing a release for an existing tag does not rebuild; use manual dispatch.
- `nightly-minor-deps-release.yml` runs daily (~00:17 AEST). `npm-check-updates --target semver --cooldown 3` raises package.json ranges within each dependency's major; 0.x packages only get patches. pnpm then re-resolves only the changed specifiers in the lockfile, because frozen installs need the two in sync. After that: lint, check, test, build and e2e, a patch bump, a tag and GitHub release, and the image via `docker-release.yml`. It does nothing when no range moved. It pushes straight to `main`, so branch protection on `main` needs a bypass for Actions.
- The Docker runner uses distroless Debian 13 plus the build stage's Node 26 binary, with no shell or package manager. Runtime maintenance must use `node scripts/*.mjs`; package managers remain in the build stage. Container scan evidence and unresolved OS findings: `docs/dev/DOCKER_SECURITY.md`.
- `.dockerignore` keeps host dependencies, generated output, local env files and SQLite caches out of build contexts. Keep source, migrations, bundled docs and package-manager configuration included.
- Entrypoint runs migrations before app/worker start; `ensureSchema()` (`src/lib/server/db/index.ts`) applies the same files under `pnpm dev` / `node build`. Persist SQLite via volume (`DATABASE_PATH`).

### Migrations must survive every release

Every release, including the automated nightly one, gets pulled straight onto running homeservers (`docker compose pull && up -d`). There, `scripts/docker-entrypoint.mjs` applies pending migrations before the app starts. If a migration fails, the container exits and the instance stays down until someone fixes it. So:

- **Append only.** Add a new `migrations/NNNN_name.sql` with the next number. Never edit, rename or delete a migration that has shipped. `schema_migrations` tracks file names, so an edited file never re-runs on existing DBs and fresh DBs end up with a different schema.
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

```bash
pnpm install
pnpm dev
pnpm test           # Vitest unit tests (grade fixes, URLs, mapAscent)
pnpm check          # svelte-check
pnpm lint           # Prettier --check + ESLint (run `pnpm format` to fix)
pnpm build
pnpm test:e2e       # Playwright + axe against the production build (run `pnpm build` first)
```

### Before push / finishing a PR (required for agents)

Do **not** push a branch, open/update a PR, or claim the task done until these have been run **locally** on the changed code and pass:

1. `pnpm lint` — Prettier + ESLint. If it fails, run `pnpm format` (and fix any ESLint issues), then lint again.
2. `pnpm check` — svelte-check / types.
3. `pnpm test` — unit tests (or at least the suites that cover what you touched).

Also run `pnpm build` when the change affects the production build or SvelteKit routes, and `pnpm test:e2e` when you touch UI, e2e fixtures, auth, or accessibility. Fix failures before pushing — do not rely on CI as the first formatter or typecheck.

When editing `.svelte` files, use the Svelte MCP autofixer until clean (see Stack & tooling above) **in addition to** `pnpm lint` / `pnpm check`.

CI (`.github/workflows/ci.yml`) runs `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build` and `pnpm test:e2e` on push/PR. The same workflow’s `docker` job builds the production image on PRs (no push). Local runs above are still mandatory so PRs do not burn a red check on Prettier-only or trivial type slips.

- **CodeQL (default setup):** Security scanning uses GitHub’s [default code scanning setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning) (`dynamic/github-code-scanning/codeql`), not a repo workflow. It runs on PRs **targeting `main` only**. Do not add a duplicate CodeQL workflow unless you explicitly dedupe against default setup.
- **Stacked PRs:** PRs whose base is a feature branch (not `main`) still get CI `check` / `docker` (and third-party checks such as Socket). Missing CodeQL there is expected — not “incomplete” checks. CodeQL runs when the stack merges to `main`. Merge stacked PRs bottom-up into their stack base, then open or retarget the final PR to `main`.

- **Unit tests** get `DATABASE_PATH=:memory:` from `vitest.config.ts`, so each test file has its own empty SQLite. Never point tests at a shared file DB: parallel workers on one WAL file fail with `disk I/O error` (#57).
- **E2E** (`e2e/`, `playwright.config.ts`): three `node build` servers on 4301–4303 (open, `AUTH_SCOPE=settings`, `AUTH_SCOPE=all`) with throwaway DBs in `e2e/.tmp`; the `setup` project imports `samples/thecrag-logbook-sample.csv`. The axe test fails on serious/critical violations in light **and** dark — fix contrast with tokens, don't weaken the test. Set the scheme before load (`test.use({ colorScheme })`), or `page.reload()` after `emulateMedia`; otherwise axe can sample nav colour transitions mid-fade (#167).
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
- Don’t HTML-scrape theCrag route pages, and don’t loosen the route-history limits (fetch once unless `ROUTE_DATA_REFRESH_DAYS` ≥ 30 is explicitly enabled, 100 per run, ≥1 s gap, stop on block). `impers` is allowed only for two explicit opt-ins: the `/api/route` history import (`ROUTE_HISTORY_IMPORT=true`) and the CSV logbook download (`THECRAG_SYNC_MODE=csv`, with its saved-session pacing and back-off). Never use it for the default API logbook sync. The one documented HTML parse is the login form's hidden CSRF fields in CSV mode; nothing else on theCrag pages may be scraped. Prefer negotiated theCrag API access.

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
| 2026-10 | `/projects` RoxClimbs-style auto-projecting cards: open = unsent attempts touched within 1 year; sent shelf = fought-then-sent within ~31 days; first-go sends never projects. No create form.                          |
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

| 2026-10 | CSV logbook download (#204/#205): opt-in `THECRAG_SYNC_MODE=csv` with `THECRAG_USERNAME`/`THECRAG_PASSWORD`; cookies encrypted with `SESSION_SECRET` in `thecrag_web_sessions` (migration **0016**; 0015 belongs to route API JSON). A placeholder or short `SESSION_SECRET` disables CSV mode. The `impers` rule in "What not to do" now covers this opt-in. |

| 2026-10 | #217: CSV sync prunes ascents missing from the export (source of truth) via `reconcileProviderAscents`. `csvPruneGuard` refuses the run before writes if the export is empty against a non-empty cache, or drops below 50% remaining when local ≥ 100 (e.g. 1000 → 230). Wipe remains the escape hatch for a genuinely smaller export. |

| 2026-10 | #201: opt-in `ROUTE_DATA_REFRESH_DAYS=30` or `90` reuses post-sync imports; new routes first, then oldest stale fetches (including missing). Unset/0 keeps fetch-once. The shared 100-route cap, pacing, back-off and manual mark protections remain. |
| 2026-10 | `ROUTE_DATA_REFRESH_DAYS` accepts whole digits 30–3650 (e.g. 180 ≈ half a year); under 30, over 3650, or non-digits still mean fetch-once. |

| 2026-10 | #195: Grade goal progress uses pyramid readiness (`gradeGoalReadiness`: ~2 distinct-route sends at N−1, ~4 at N−2; capped below 100% until a send at N), not linear best/target. Height/days stay linear. `/docs/goals` explains the model; dashboard + Goals page link “How it works”. |
| 2026-10 | #226: Grade readiness also fills from non-send ticks at ≥ N−1 (up to ~+20%), with horizon-scaled soft needs (short ~15 / medium ~35 / long-haul ~75). Still capped at 95% without a send at N. |

| 2026-10 | #209: `data:0004_invalidate_incomplete_route_cache` deletes `status='ok'` `route_history_fetches` rows for routes missing post-0012/0015 cache evidence (`route_info_updated_at` or `route_api_json` null) so upgrades re-queue imports without manual Refresh all. Leaves `missing` rows alone. Future route-info SQL/data migrations must follow the same invalidation pattern (`docs/dev/ROUTE_HISTORY.md`). |
| 2026-10 | CSV AU boulder grades: bare digits + Australia (Country / Crag Path / australia URL) pass `gradeSystem: 'AU'` in `csv.ts` so Upendi `9` → VB (not fake V9); explicit `V…` stays V-scale (#124). `repairGradesFromRawJson` remaps flat CSV `raw_json`; `data:0003_csv_au_boulder_grades` repairs existing DBs. CSV sync sets profile login/name from `THECRAG_USERNAME` and nulls API-only account fields; route-history `ownerLogin` prefers that username in CSV mode when a shared API key is used. |

| 2026-10 | #214 review: cached CSV grade repair changes grade columns only, preserving API-only metadata. Inferred AU ascent overlays cannot override explicit V route grades. CSV route-history imports and cached reapplication require the configured username to match the saved profile login (case-insensitive); empty/mismatched overrides never fall back to another identity. |

| 2026-10 | #218 review: automatic CSV sync counts the current logbook after downloading, then guards/upserts/prunes/updates the profile in one immediate SQLite transaction. Guard refusals and later write failures leave the logbook unchanged. Manual CSV uploads remain upsert-only. |

| 2026-10 | #215 review: CSV mode prevents newly enabling notes, but an existing opt-in must remain switchable off. The server accepts disabling in every mode, refuses CSV enablement, and retains the no-password visibility warning. Browser regression covers API notes retained in a CSV-mode DB and crafted preference POSTs. |

| 2026-10 | #219: Logbook sync stays in user `/docs` (`docs/guide/logbook-sync.md`); README/DEPLOY cross-link it; household-key detail stays in `docs/dev/ROUTE_HISTORY.md` via GitHub URL from the guide. |

| 2026-10 | #224: Settings no longer offers a First Moves date control. The first successful non-empty sync/import always stamps `first_import` when `at` is still null (legacy “unknown until owner corrects” path removed). |

| 2026-10 | Security remediation pins pnpm patches for deepmerge 4.3.1, picomatch 4.0.7 and uri-js 4.4.1, with installed-package exploit regressions in `dependencySecurity.test.ts`. Keep `patches/` available before Docker's frozen install. Adapter-node is build-only. Read `patches/README.md` and `docs/dev/SECURITY_SCAN.md`; version-based alerts can persist despite local fixes and must remain disclosed. |

- First ascents attribution follows saved mark source (plus cached setter credits), not `ROUTE_HISTORY_IMPORT`: manual/imported credits coexist and imported marks survive disabling import.

- Node 26 LTS is the runtime baseline. Install the exact `packageManager` with npm (Corepack is not bundled); the distroless image also needs the build-stage libatomic shared library. Validate native SQLite and importer on amd64 and arm64 after runtime updates.

_Add a row when you change behaviour agents must know about._

- Settings CSV import keeps the file picker and submit action stacked and left-aligned; avoid a growing file input that pushes the action to the card's far edge.
- Route-history status exposes `retryAt` from the existing minimum run interval and upstream back-off. Settings counts down from server time and enables the action when due; retain the server pacing guards.
- Sessions per week card: a session is a calendar day with ≥1 ascent; ISO weeks (Mon start); helpers in `#lib/sessionsPerWeek` (shared, not server-only).
