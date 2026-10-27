# AGENTS.md — Crag Stats

> **Living document.** Future AI agents (and humans) should read this before changing the repo, and **update it** when they learn something new, correct a mistake, or retire outdated guidance. Prefer short, actionable notes over essays. Remove stale info rather than commenting it out.

Self-hosted climbing analytics for [theCrag](https://www.thecrag.com/), inspired by [Dreeve](https://dreeve.app/) (Stats for Strava) and [RoxClimbs](https://roxclimbs.com/). MIT licensed.

---

## Product principles

1. **Upstream is source of truth.** Like Dreeve ↔ Strava: theCrag owns the logbook. Local SQLite is a cache + analytics store.
   - API sync **upserts** creates/updates (comments, grades, ticks, heights, etc.).
   - API sync **deletes** local ascents that no longer exist upstream, then orphans routes/projects.
   - Do **not** invent a second editable logbook that drifts from theCrag.
   - CSV import is upsert-only (no prune). Prefer API sync when the user has a supporter key.
2. **Privacy.** API keys expose private notes. Never commit `.env`. Wipe must remain available in Settings.
   - `APP_PASSWORD` + `AUTH_SCOPE=settings|all` gate admin (or whole UI). Login is rate-limited in-process (5 fails / 15 min + min gap).
   - Prefer Cloudflare Access on `/settings*` + `/login*` in front of public tunnels; app password remains a second factor.
   - Open redirects are blocked via `safeRedirectPath`; passwords compared via HMAC digests (timing-safe).
3. **Provider-shaped.** Core types live under `src/lib/server/providers/`. theCrag is first; Mountain Project later. Keep canonical ascent/route shapes provider-agnostic.
4. **Grade honesty.** Never mix grading systems in one pyramid row list. Split by climb style and/or convert into the user’s preferred system.

---

## Stack & tooling

| Piece | Choice |
|---|---|
| App | SvelteKit 3 + Svelte 5 (runes: `$props`, `$derived`, `$state`) |
| CSS | Tailwind 4 where useful + theme tokens in `src/app.css` (light/dark) |
| Font | Plus Jakarta Sans (bundled via `@fontsource-variable/plus-jakarta-sans`, no CDN) |
| DB | SQLite via `better-sqlite3` + Drizzle ORM |
| Package manager | **pnpm** (pin via `package.json#packageManager`; config in `pnpm-workspace.yaml`) |
| Node | 24 LTS+ |
| Deploy | Docker multi-arch → GHCR (`ghcr.io/luen/crag-stats`) |
| Migrations | Versioned SQL in `/migrations`, run on container boot via `scripts/docker-entrypoint.mjs` |
| i18n | Planned (Crowdin epic/issue) — not implemented yet |

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
  sync.ts                # runTheCragSync (full pull + prune)
  providers/thecrag/     # API + CSV mappers
  db/schema.ts
migrations/              # 0001_init.sql, …
scripts/                 # migrate, docker-entrypoint, worker
.github/workflows/       # ci, docker-release (tag/release → GHCR)
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
6. Scheduler (`SYNC_CRON`, default daily) calls the same reconcile path.

Cursor/`maxEpoch` is still stored for diagnostics; it is **not** used to skip a full pull.

Height quirk: theCrag may return height as `[value, unit]` arrays — parse in the API mapper (`parseHeightMeters` / array handler).

---

## Grades & colours

- Canonical numeric scores lean on **Ewbank** for routes and **V-scale** for boulder; convert for display via `src/lib/grades`.
- Band palette (Beginner → Elite) matches theCrag article colours — see `bands.ts`. Boulder: VB± green, **V0± yellow** (Intermediate), V1–V4 orange, V5–V10 red, V11+ purple (`bandFromVScale`).
- Preferred system: cookie `cs_grade_system` + env `PREFERRED_GRADE_SYSTEM`.
- **Style pyramids** group by Sport / Trad / Boulder / Top rope / … with stacked tick segments. Do not dump mixed VB + `7a` + `19` in one unordered list. Pyramid grade chips/bars link to `/logbook?style=&score=` (integer score buckets).
- **Grade-system fit:** reject boulder CPR/V-scale on sport/trad (caused Trad `−1` / VB rows). On boulder, bare AU/Ewbank numbers (e.g. Upendi `5`) map to **V5**. Font `5A` must not steal French `5a` on routes.
- **V-scale ranges** like `V1/2` or `V5/6` must parse as midpoints (1.5, 5.5). Never fall back to gradeBand Ewbank midpoints (21/28/…) as V-scores — that produced fake “V21” / “V28”.
- **Multipitch:** use `ascent.pitch[]` from the API. Effective grade = hardest **climbed** pitch (not the full route grade). Store `effective_grade_*` + `pitch_label` (e.g. `P1`) on ascents. Analytics/hardest lists must use effective grades. `repairGradesFromRawJson()` re-derives from stored `raw_json` after parser fixes (also partners/quality/label/tags).
- **Ascent meta from API:** `with` → partners, `quality`/`qualityLabel`, `label` → ascent_label (prefer over route name when set), `route.tags` → tags_json chips, account `outdoorAscentCount` / `indoorAscentCount` / `typeOfClimber` / `heightClimbed`.
- **URLs:** `urlAncestorStub` is an *area* path and often has **no leading slash**. Never concatenate as `https://www.thecrag.com${stub}` (produces `thecrag.comaustralia/...`). Use helpers in `src/lib/thecragUrls.ts`:
  - Route: `https://www.thecrag.com/en/climbing/{stub}/route/{routeId}`
  - Area/crag (TLC): `https://www.thecrag.com/en/climbing/{stub}/area/{areaId}` (e.g. Castle Hill)
  - Ascent (preferred for “your tick” links): `https://www.thecrag.com/ascent/{ascentId}`

---

## Analytics quirks

- **Climber type:** if one of Sport / Trad / Boulder is ≥ **40%** of ascents → “Sport climber” (etc.); else “Rock climber”.
- **CPR timelines:** approximate model in `cpr.ts` (power factor P=5, tick shifts, ~0.7 grade/year decay). Link/docs: theCrag CPR articles. Label UI as approximate — not a byte-for-byte clone.
- **Notable ascents:** by style + by area; use `StyleBadge` + `TickTypeIcon` (theCrag-like SVGs).
- Summary metrics: onsights, successful ascents, distance climbed (km).

---

## UI icons (theCrag-like)

| Tick | Visual |
|---|---|
| Onsight | Blue eye |
| Flash | Yellow bolt, red outline |
| Red point | Red filled circle |
| Pink point | Pink filled circle |
| Tick | Black check |
| Clean / Send | Green check |
| Top rope | “Top” text + small check |

Components: `TickTypeIcon.svelte`, `StyleBadge.svelte`. Keep icons SVG-inline so they theme/print cleanly.

---

## Theme & app shell

- **Tokens only.** Colours come from `src/app.css` (`--bg`, `--paper`, `--surface-2/3`, `--ink`, `--ink-muted`, `--line`, `--accent` rope orange, `--accent-soft`, `--shadow`). Don't hard-code `white`/`#fff` surfaces or ink-tinted `rgba()` — they break dark mode. Use `color-mix(in srgb, var(--ink) N%, transparent)` for tints. `color: #fff` on an accent/coloured fill is fine.
- SVG presentation attributes can't take `var()` reliably — use `style="stroke: var(--ink)"` instead.
- **Dark mode:** OS preference by default; header toggle stores `cs_theme` in localStorage → `html[data-theme]`. Applied pre-paint by the inline script in `app.html`.
- **Shell (Dreeve-style):** fixed top bar (sidebar toggle, logo, GitHub, theme, settings) + grouped icon sidebar with count badges (`navCounts` from `+layout.server.ts`, hidden when `AUTH_SCOPE=all` and logged out). Desktop toggle collapses to a mini icon rail with hover tooltips (`cs_sidebar=mini` → `html[data-sidebar='mini']`); ≤860px it's an off-canvas drawer.
- Icons: `NavIcon.svelte` (inline outline SVGs). Logo/favicon: `src/lib/assets/favicon.svg` (flat orange crag, grade bars masked out / transparent — no circle, no gradient).
- Full style guide (tokens, logo, theCrag band + discipline colours, shell): **`docs/dev/BRANDING.md`** — update it with any visual change.

## Docker / release

- Compose: `docker-compose.yml` (build) and `docker-compose.ghcr.yml` (pull image).
- Release workflow builds multi-arch and pushes on version tags (`v0.1.0`, …).
- Entrypoint runs migrations before app/worker start. Persist SQLite via volume (`DATABASE_PATH`).

---

## Commands

```bash
pnpm install
pnpm dev
pnpm test           # Vitest unit tests (grade fixes, URLs, mapAscent) — run before commit
pnpm check          # svelte-check — run before claiming done
pnpm build
```

CI (`.github/workflows/ci.yml`) runs `pnpm check`, `pnpm test`, and `pnpm build` on push/PR.

Prefer fixing type errors over `@ts-ignore`. Do not switch the package manager.

---

## What not to do

- Don’t treat local DB as authoritative over theCrag for logbook rows.
- Don’t reintroduce incremental-only sync without a delete/tombstone strategy.
- Don’t import server DB code into client components.
- Don’t commit secrets, sample private notes, or real API keys.
- Don’t expand scope into wearables / Mountain Project until the matching epic is in play — keep PRs focused.
- Don’t claim CPR is identical to theCrag’s proprietary score.

---

## Changelog for agents

| When | Note |
|---|---|
| 2026-03 | Initial MVP: sync, CSV, dashboard, pyramids, CPR approx, GHCR, pnpm |
| 2026-03 | Sync made full reconcile (upsert + prune). Tick/style SVG icons. This file created as living docs. |
| 2026-03 | Fixed V1/2 range parsing; multipitch effective grades (pitch ticks); hardest ascents use ascent effective grade. |
| 2026-03 | Fixed broken theCrag links (missing slash / area stub); link to `/ascent/{id}` or `/en/climbing/.../route/{id}`. |
| 2026-03 | Grade-system fit + AU boulder→V; pyramid→logbook links; partners/quality/label/tags; outdoor/indoor; ascent heatmap (#12–#25). |
| 2026-03 | AU ascent grades on V-scale boulder routes must not become V12 (prefer route V-grade). Notable rowspan grouping. Side nav + version. Blurb/streaks/climber profile. |
| 2026-03 | Vitest suite (`pnpm test`) for grade/URL/mapAscent regressions; CI runs tests. |
| 2026-03 | Streaks: reject invalid ascent dates (`2018-00-00`); guard week/month loops — NaN week keys hung the dashboard. |
| 2026-03 | Phase 4–5: CPR shifted/decayed + attempts + route lat/lon (migration 0006); Goals / Rewind / Sectors pages; SVG CragMap (no Leaflet dep). |
| 2026-03 | Dashboard extras: monthly/yearly/milestones/training load, style mix, partners, stars/quality, rock types + blurb; CPR prefers API when dense; logbook sort/band/multipitch/season/sector; pyramid `?pyramid=` toggles. |
| 2026-10 | Auth harden: login rate limit, safe redirects, HMAC password/worker-secret compares, security headers, `/logout`. CF Access for `crag.luenwarneke.com` settings/login. CPR SVG NaN guards. |
| 2026-10 | Mobile: heatmap/charts scroll, yearly cards, notable stacked groups; pyramid active pill `--paper` + “All” label. |
| 2026-10 | pnpm 12.15.0 via `packageManager`; config in `pnpm-workspace.yaml` (`allowBuilds`, `minimumReleaseAge: 0`). Docker reads pin from package.json. |
| 2026-10 | Runtime pin Node 24 LTS (CI, Docker `node:24-bookworm-slim`, `engines.node`, `.nvmrc`). |
| 2026-10 | Badges carousel on dashboard (RoxClimbs-style milestones from logbook: sends, onsights, countries, height, bands). |
| 2026-10 | Goals: Active/Achieved + progress bars; grade = send ≥ X this year; venue_scope outdoor/indoor/any (migration 0007); dashboard shows 3 active goals. |
| 2026-10 | `/projects` RoxClimbs-style auto-projecting cards: open = unsent attempts touched within 1 year; sent shelf = fought-then-sent within ~31 days; first-go sends never projects. No create form. |
| 2026-10 | Dashboard Projects card: top 3 open by sessions/tries (`listDashboardProjects`); layout id `projects` beside goals. |
| 2026-10 | Dashboard card show/order via cookie `cs_dash_layout` (Dreeve-style); hero + metrics fixed; Customize panel on `/`. Defaults = current order. See `dashboardLayout.ts`. |
| 2026-10 | Discipline colours unified via `STYLE_COLORS` in `ticks.ts` (Sport blue, Trad orange, Boulder red) — Style mix + climber-type share the same palette as StyleBadge. |

| 2026-10 | Dreeve-style redesign: theme tokens + dark mode, Plus Jakarta Sans, new logo, top bar + collapsible mini sidebar / mobile drawer, nav count badges. |

_Add a row when you change behaviour agents must know about._
