# Route history import (developer notes)

User-facing explanation: [`docs/guide/first-ascents.md`](../guide/first-ascents.md). This page covers how it works and why. Tracking issue: #68.

## Turning it on

`ROUTE_HISTORY_IMPORT=true` in `.env` (default **off**). When it's off, nothing below runs, `impers` is never imported, and its native library is never downloaded.

## Why it needs `impers`

theCrag's logbook API (`/api/logbook/ascents`) works with plain `fetch` and doesn't include route history. `/api/route/ids?show=info` does include it, but Cloudflare blocks non-browser clients there (a 403 "Sorry, you have been blocked" page, even with a valid key). [`impers`](https://github.com/lexiforest/impers) presents a browser-like TLS/HTTP2 fingerprint, so those requests get through.

That works around theCrag's bot protection. theCrag says broader API access is negotiated with them, so this is opt-in and at the owner's own risk. Prefer asking theCrag for route API access, which would let us drop `impers` and use plain `fetch`. Never use impersonation for the logbook sync.

`impers` loads a pinned **libcurl-impersonate (v2.2.2)** through `koffi`. It downloads it from GitHub on first use, without checksum verification, into `IMPER_CACHE_DIR`. The Docker image points that at `/data/.cache/impers` (with `IMPERSONATE_CONFIG_DIR=/data/.cache/impersonate`), so the download happens once per volume. If `impers` or the library can't load (unsupported platform, offline), the run fails with `RouteHistoryUnavailableError`, backs off for 24 h, and manual marks keep working.

## Pacing and caching (`src/lib/server/routeHistoryEngine.ts`)

| Rule                                            | Constant / table                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Each route checked once, ever                   | `route_history_fetches` (`ok` or `missing`)                                               |
| At most 20 routes per run                       | `ROUTES_PER_RUN`, sent as 2 requests of 10 (`BATCH_SIZE`)                                 |
| ≥ 1.1 s between any two requests, across runs   | `MIN_REQUEST_GAP_MS` (in-process `lastRequestAt`)                                         |
| ≥ 1 minute between runs                         | `MIN_RUN_INTERVAL_MS`                                                                     |
| One `impers` session per run                    | `openRouteHistoryClient()`, closed in `finally`                                           |
| Stop at the first error, no retries             | the run ends; nothing is retried in a loop                                                |
| Block: any 403, 429, 503, or HTML/CF error body | `RouteHistoryBlockedError`: back off 24 h, doubling to 7 days, and at least `Retry-After` |
| Other errors / `impers` unavailable             | back off 1 h (unavailable: flat 24 h), doubling to 24 h                                   |

Pacing (`running`, `lastRequestAt`) is **process-local**. The usual Docker deploy is one `app` container; don't run multiple Node processes against the same DB without a DB-backed lease.

- **When runs happen:** `triggerRouteHistoryImport()` runs in the background after each successful `runTheCragSync()` (daily cron, the worker, or Settings → Sync). Settings → _Check next 20 routes now_ **awaits** `runRouteHistoryImport()` and shows the real outcome (`ran` / `waiting` / `busy` / `done` / error), so it won't claim a check started when the engine refused.
- **Order:** ungraded routes first (likeliest new lines), then most recently climbed.
- **Missing routes:** a route the response leaves out is recorded as `missing` and not asked for again. Only _Refresh all_ (`resetRouteHistoryFetches()`) makes routes eligible again, and that's still 20 per run. Refresh updates cached history on the next fetches; use _Re-apply from saved history_ (with _Replace existing_ if needed) to push corrections into `first_ascents`.

## Marks

`ownerKindsFromHistory()` (`providers/thecrag/routeHistoryParse.ts`) only matches an `@login` mention equal to `profiles.login`. FFA wins over FA on the same route. Imported marks get `first_ascents.source = 'import'`.

- An existing mark is never overwritten, and a route in `first_ascent_import_skips` (the owner unmarked it) is never re-marked.
- `applyCachedHistoryMarks({ replaceExisting, reapplyUnmarked })` re-applies from `route_history` without any network. That's Settings → _Re-apply from saved history_.

## Tables (migration `0010_route_history.sql`, upgrade `0011_route_history_fetch_once.sql`)

`route_history` (public history rows, including types other than FA/FFA, kept for #76), `route_history_fetches`, `first_ascent_import_skips`, `route_history_import_state`. All are cleared by `wipeAllData()`.

`0011` rebuilds `route_history_import_state` and adds `route_history_fetches` for databases that already applied the first draft of `0010` (offset/total progress). `schema_migrations` never re-runs an edited file, so that upgrade has to be a new migration.

## Tests

Everything is tested offline with a fake client and clock: `routeHistoryEngine.test.ts`, `providers/thecrag/routeHistoryApi.test.ts` (response classification), `routeHistoryParse.test.ts`. No test talks to theCrag.

## Follow-ups that reuse the same fetch

Setter credits (#76), the Project flag (#77), seasonality (#78), popularity (#79), qualityScore (#80), beta and access warnings (#81), ancestors, pitches and flags (#82). Store those fields in the same pass rather than fetching again.
