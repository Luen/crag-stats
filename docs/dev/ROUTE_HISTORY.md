# Route history import (developer notes)

User-facing explanation: [`docs/guide/first-ascents.md`](../guide/first-ascents.md). This page covers how it works and why. Tracking issue: #68.

## Turning it on

`ROUTE_HISTORY_IMPORT=true` in `.env` (default **off**). When it's off, nothing below runs, `impers` is never imported, and its native library is never downloaded.

Set `ROUTE_DATA_REFRESH_DAYS` to a whole number of days from 30 through 3650 (~10 years) for rolling refreshes (fixed days, not calendar months) — e.g. `90` (recommended), `30`, or `180` (~half a year). Unset, `0`, under 30, over 3650, or non-digit values keep the default fetch-once behavior. This still requires `ROUTE_HISTORY_IMPORT=true` and an API key. No separate timer runs: successful logbook syncs and manual runs process eligible routes within the same 100-route budget, so a large backlog may take several syncs to refresh.

## Household / shared supporter key with CSV mode

Route history uses `THECRAG_API_KEY` against `/api/route/ids`. That key is a **supporter** credential. Free accounts do not get a personal logbook/route API key in the browser: a HAR of a logged-in free climber browsing route pages shows no `key=` / supporter API token on `/api/route/ids` (only unrelated map-tile `apiServer.key` scaffolding and cookie-auth HTML/API lookups). So the unpaid partner cannot “use their own route key” for this import.

When one person in a household has a supporter account and the other does not, a workable homeserver layout is:

1. **Paid partner** — `THECRAG_SYNC_MODE=api` with their own `THECRAG_API_KEY` (full logbook sync + optional route history on their instance).
2. **Unpaid partner** — `THECRAG_SYNC_MODE=csv` with _their_ `THECRAG_USERNAME` / `THECRAG_PASSWORD` / `SESSION_SECRET` for the logbook, plus the **paid partner’s** `THECRAG_API_KEY` only for `ROUTE_HISTORY_IMPORT` (and optional `ROUTE_DATA_REFRESH_DAYS`).

Crag Stats treats CSV identity as the configured username: sync sets `profiles.login` / `name` from `THECRAG_USERNAME`, clears API-only profile fields (`routesTicked`, outdoor/indoor counts, avatar, `raw_json`, …), and FA/setter matching prefers that username in CSV mode. That keeps the key owner’s account stats and FA credits from bleeding onto the CSV instance. Still: the shared key can read the key owner’s private logbook notes if misused — keep `.env` private, one key per trusted household, and prefer the unpaid partner getting their own supporter key when they can.

## Why it needs `impers`

theCrag's logbook API (`/api/logbook/ascents`) works with plain `fetch` and doesn't include route history. `/api/route/ids?show=info,ancestors` does include it (plus route-level fields used by #77–#82), but Cloudflare blocks non-browser clients there (a 403 "Sorry, you have been blocked" page, even with a valid key). [`impers`](https://github.com/lexiforest/impers) presents a browser-like TLS/HTTP2 fingerprint, so those requests get through.

That works around theCrag's bot protection. theCrag says broader API access is negotiated with them, so this is opt-in and at the owner's own risk. Prefer asking theCrag for route API access, which would let us drop `impers` and use plain `fetch`. Never use impersonation for the logbook sync.

`impers` loads a pinned **libcurl-impersonate (v2.2.2)** through `koffi`. It downloads it from GitHub on first use, without checksum verification, into `IMPER_CACHE_DIR`. The Docker image points that at `/data/.cache/impers` (with `IMPERSONATE_CONFIG_DIR=/data/.cache/impersonate`), so the download happens once per volume. If `impers` or the library can't load (unsupported platform, offline), the run fails with `RouteHistoryUnavailableError`, backs off for 24 h, and manual marks keep working.

## Pacing and caching (`src/lib/server/routeHistoryEngine.ts`)

| Rule                                              | Constant / table                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Fetch once by default; optional 30/90-day refresh | `route_history_fetches` (`ok` or `missing`)                                               |
| At most 100 routes per run                        | `ROUTES_PER_RUN`, sent as 10 requests of 10 (`BATCH_SIZE`)                                |
| ≥ 1.1 s between any two requests, across runs     | `MIN_REQUEST_GAP_MS` (in-process `lastRequestAt`)                                         |
| ≥ 1 minute between runs                           | `MIN_RUN_INTERVAL_MS`                                                                     |
| One `impers` session per run                      | `openRouteHistoryClient()`, closed in `finally`                                           |
| Stop at the first error, no retries               | the run ends; nothing is retried in a loop                                                |
| Block: any 403, 429, 503, or HTML/CF error body   | `RouteHistoryBlockedError`: back off 24 h, doubling to 7 days, and at least `Retry-After` |
| Other errors / `impers` unavailable               | back off 1 h (unavailable: flat 24 h), doubling to 24 h                                   |

Pacing (`running`, `lastRequestAt`) is **process-local**. The usual Docker deploy is one `app` container; don't run multiple Node processes against the same DB without a DB-backed lease.

- **When runs happen:** `triggerRouteHistoryImport()` runs in the background after each successful `runTheCragSync()` (daily cron, the worker, or Settings → Sync). Settings → _Check next 100 routes now_ **awaits** `runRouteHistoryImport()` and shows the real outcome (`ran` / `waiting` / `busy` / `done` / error), so it won't claim a check started when the engine refused.
- **Order:** never-fetched routes first (ungraded, then most recently climbed), followed by stale fetches oldest first. Eligibility uses `route_history_fetches.fetched_at`, including `missing` results. Settings pending counts include stale routes; checked counts still include all previously fetched routes.
- **Missing routes:** a route the response leaves out is recorded as `missing` and not asked for again until its refresh age is reached (when enabled). _Refresh all_ (`resetRouteHistoryFetches()`) makes routes eligible again, and that's still 100 per run. Each successful fetch **replaces** that route's cached `route_history` rows (including clearing them when the API returns none), so upstream deletions are not sticky. Use _Re-apply from saved history_ (with _Replace existing_ if needed) to push corrections into `first_ascents`.
- **Wipe vs in-flight run:** `wipeAllData()` calls `invalidateRouteHistoryRuns()` so a request that was already in flight abandons after its next await and does not write history/marks back into the empty DB.

## Marks

`ownerKindsFromHistory()` (`providers/thecrag/routeHistoryParse.ts`) only matches an `@login` mention equal to `profiles.login`. FFA wins over FA on the same route. Imported marks get `first_ascents.source = 'import'`.

- An existing mark is never overwritten, and a route in `first_ascent_import_skips` (the owner unmarked it) is never re-marked.
- `applyCachedHistoryMarks({ replaceExisting, reapplyUnmarked })` re-applies from successfully fetched routes (`route_history_fetches.status='ok'`) without any network — including empty history. With `replaceExisting`, imported marks are cleared when history no longer credits `@login`; manual marks stay. That's Settings → _Re-apply from saved history_.

## Tables (migration `0010_route_history.sql`, upgrade `0011_route_history_fetch_once.sql`)

`route_history` (public history rows, including types other than FA/FFA, kept for #76), `route_history_fetches`, `first_ascent_import_skips`, `route_history_import_state`. All are cleared by `wipeAllData()`.

`0011` rebuilds `route_history_import_state` and adds `route_history_fetches` for databases that already applied the first draft of `0010` (offset/total progress). `schema_migrations` never re-runs an edited file, so that upgrade has to be a new migration.

## Tests

Everything is tested offline with a fake client and clock: `routeHistoryEngine.test.ts`, `providers/thecrag/routeHistoryApi.test.ts` (response classification), `routeHistoryParse.test.ts`. No test talks to theCrag.

## Route info cache on `routes` (migration `0012_route_info.sql`, #77–#82)

Each successful fetch also upserts nullable columns on the matching `routes` row (when the API sends them):

| Column                                              | Source field                                                 | Issues                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `is_project`                                        | `flags` contains Project                                     | #77                                                                                                                                                                                                                                                                |
| `seasonality_json`                                  | `seasonality` (12 months)                                    | #78                                                                                                                                                                                                                                                                |
| `ascent_count`, `popularity`, `relative_popularity` | same names                                                   | #79                                                                                                                                                                                                                                                                |
| `quality_score`                                     | `qualityScore`                                               | #80                                                                                                                                                                                                                                                                |
| `beta_json`                                         | public `beta` excerpts + route page URL (never ascent notes) | #81                                                                                                                                                                                                                                                                |
| `ancestors_json`, `pitches_json`, `flags_json`      | same names                                                   | #82 — `/sectors` drill-down, multipitch/style hints; parser-recognised flag strings (only `Project` confirmed) and blocked logbook facets: [`LOGBOOK_FACETS.md`](LOGBOOK_FACETS.md#route-flags-routesflags_json--recognised-strings-and-their-evidence-173) (#173) |
| `route_info_updated_at`                             | import timestamp                                             | —                                                                                                                                                                                                                                                                  |
| `route_api_json`                                    | **entire** route object from the response                    | #197 — future fields without a paced re-fetch                                                                                                                                                                                                                      |

Parsing lives in `parseRouteInfoFields()` / `parseRoutePayload()` (`routeHistoryApi.ts`); `storeBatch()` writes them in `routeHistoryEngine.ts`. No extra requests — same pacing as history. Omitted fields preserve cached values in partial payloads; explicit null clears them. Successful empty beta/arrays replace the old content.

`route_api_json` (migration `0015`) is the last successful full route object. UI code should keep using the column cache / `beta_json` excerpts; dig into `route_api_json` only when adding a new analytic. `route_history.raw_json` stores each history item’s **original** API object (not only `{id,type,climbers,date}`).

### Logbook API retention (private key)

`/api/logbook/ascents` already persists every ascent as `ascents.raw_json` and the account summary as `profiles.raw_json`. Column mapping extracts what the app uses today; undocumented or newly documented fields (`historical`, `cprStyle`, ascent-level `tags`, `route.gradeAtom`, …) remain recoverable from those blobs without another full logbook sync.

Upgrades that add or extend route-info cache columns must **invalidate** affected routes in the same release so fetch-once DBs do not stick with incomplete caches until someone runs Refresh all. Prefer deleting matching `route_history_fetches` rows with `status='ok'` (routes become `history=pending` again) while leaving `missing` ledger rows, `route_history`, marks, and import pacing untouched. Example one-shot repair (`data:0004_invalidate_incomplete_route_cache` in `dataMigrations.ts`; after `data:0003_csv_au_boulder_grades`):

```sql
DELETE FROM route_history_fetches
WHERE rowid IN (
  SELECT f.rowid
  FROM route_history_fetches f
  INNER JOIN routes r ON r.provider = f.provider AND r.external_id = f.route_external_id
  WHERE f.status = 'ok'
    AND (r.route_info_updated_at IS NULL OR r.route_api_json IS NULL)
);
```

Installs that imported routes before migration `0015` may re-queue nearly every successful fetch (still 100 routes per run).

New SQL migrations can inline the same pattern (scoped to the new columns) or call an appended `data:` migration when the invalidation needs joins or app logic. Settings **Refresh all** stays a manual escape hatch; user guides must not tell owners to run it after every schema upgrade.

Periodic refreshes reuse the normal payload/cache path: totals, owner-count snapshots and counter freshness update together only when `ascentCount` is present. Omitted fields preserve values, explicit null clears them, and manual FA/FFA marks and unmarks remain protected.

**`quality_score` (#80):** when cached, the dashboard stars scatter uses a 0–100 quality axis (stars map to the same scale as fallback). Logbook **Quality** sort prefers `quality_score`, then ascent quality labels, then stars.

**`beta_json` (#81):** project cards show short public description excerpts, access warnings, and CC BY-SA attribution linking to the route page (never private ascent notes).

## Follow-ups that reuse the same fetch

Setter credits (#76) can join the same payload when we extend the parser. Project flag, seasonality, popularity, quality, beta, ancestors, pitches and flags are cached as above.

Logbook popularity sorting uses relative popularity, falling back to global popularity; routes with only an ascent count remain last in either order. Counts are not popularity scores. Quality sorting shares the label/score fallback helper with the dashboard.

The full `route_api_json` and history `raw_json` payloads are server-only caches. They may contain fields excluded from the public column cache; never return them from page loads, embeds, OG text, or visitor APIs. Public views use explicit column whitelists and sanitized beta excerpts.
