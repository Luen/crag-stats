# Logbook sync

Crag Stats gets your logbook in one of two ways:

- **API sync** with a theCrag supporter API key. It runs on the existing schedule (`SYNC_CRON`, daily by default), from **Settings → Sync now** (open **`/settings`**, or **`/login`** first when `APP_PASSWORD` is set), and from the Docker worker. A new installation syncs on startup when a key is configured.
- **Manual CSV upload**. Export your logbook on theCrag and upload the file in **Settings → CSV import** whenever you want to refresh.

## Backup: keep a local copy

Your theCrag account remains the source of truth for the live logbook. Crag Stats stores synced ascents, settings, goals, route-history cache, weather days and related state in **SQLite** (`DATABASE_PATH`, typically `./data/crag-stats.sqlite` or `/data/crag-stats.sqlite` in Docker). Back up the Docker **data volume** (or the host directory you mount at `/data`) with the rest of your homelab backups. For a consistent file backup, stop every app and worker using that database, copy the volume including any `-wal` / `-shm` sidecars, then restart them. Copying these files one at a time while writers are running can produce an inconsistent backup; use a SQLite-aware online backup tool if you need to keep the app running. Compose already persists the volume across image upgrades.

For a portable spreadsheet-style copy, open **Settings → Privacy & data control** and use **Download logbook CSV** (same action as `/settings/export`). The file is a theCrag-like CSV of the local logbook: routes, ticks, partners, quality, dates and comments/notes. Notes are always included in this download because it is your backup; treat the file like personal data. You can re-import it later with **Settings → CSV import** (upsert only — it does not remove ascents that are missing from the file). Download a CSV before **Wipe all local data** if you want a fallback while rebuilding from theCrag — a volume backup is still the complete restore path.

The Settings CSV is from Crag Stats, not a live pull from theCrag. For an upstream backup of the logbook itself, use theCrag’s own **Action → Export logbook as CSV** in your online logbook as well.

## What a manual sync imported

After **Sync now** or **Full re-sync** succeeds, Settings shows processed ascents,
new ascents, existing ascents refreshed, new routes, and removed ascents/routes.
A route shared by several ascents counts as one new route. “Refreshed” means an
existing ascent was processed again; it does not mean its contents changed.
An unchanged logbook therefore shows zero additions/removals and existing ascents
refreshed. Skipped runs and errors show their own messages, not a success summary.

Manual CSV uploads show processed/new/refreshed counts too, but never remove
missing entries. Route-history and weather enrichment are separate background
imports and are not included in these logbook counts. The summary describes the
completed button action; it is not a persistent sync history.

## API sync

Set `THECRAG_API_KEY` to your supporter logbook read key. Each sync reads the full logbook and reconciles local ascents, including deletions. This mode provides richer route, profile, and multipitch data, and it is the only way Crag Stats contacts theCrag for your logbook automatically.

### If API sync fails

Settings shows the failure and retains the time of the last successful sync. The message names the cause when theCrag reports one, followed by theCrag's short error code (for example `invalid-api-key`):

- **Invalid key:** theCrag rejected `THECRAG_API_KEY`. Check it for typos, or replace it if it expired or was revoked, then restart the server.
- **Access denied:** the key lacks logbook read access. Check your supporter key, or upload your CSV export by hand instead (below).
- **Usage limit:** the key has hit theCrag's request limit. Wait for it to reset, then sync again.

If a later page fails, updates from earlier pages remain cached, but no missing ascents are deleted and the run is not marked successful. The next scheduled run (daily by default) or **Sync now** retries the full logbook from page 1. API failures do not pause the schedule.

## Manual CSV upload

No supporter key? On theCrag, open your logbook and choose **Action → Export logbook as CSV**, then upload the file in **Settings → CSV import**. Repeat whenever you want to bring in new ticks.

Manual uploads add and update ascents but never remove ascents that are missing from the file. To drop deleted ticks, **Wipe all local data** and upload a fresh export. The CSV has fewer fields than the API, including less profile, route metadata, and multipitch information, and it does not include theCrag's private ascent notes (`privateMarkdown`); only the public Comment column is imported. Australian bare boulder digits use Country / path as an AU hint so they do not become fake V-grades.

Route data import matches FA/FFA credits against your theCrag username. API sync saves it from your profile; a CSV-only install sets it with `THECRAG_USERNAME`. Without it the import stops before fetching anything, so set it (or mark first ascents by hand in the logbook).

## CSV logbook with route data

You can keep the logbook in CSV and still have route data (popularity, ascent counts, quality, seasonality, pitches) and automatic FA/FFA marks. Set:

- `CSV_INGEST_TOKEN`: a long random value. It is what lets a container or script send you a CSV export, so it also tells Crag Stats that uploads are the logbook source: no API sync runs, so uploaded ascents are never removed, and the sync never writes the key holder's climber profile.
- `THECRAG_API_KEY`: your supporter logbook read key, now used only for route data and crag/sector location lookups.
- `THECRAG_USERNAME`: your theCrag username, so FA/FFA history matches you (CSV exports don't include it).

That is the whole configuration: three values, no mode switch. Without `CSV_INGEST_TOKEN`, `THECRAG_API_KEY` syncs the logbook and route data shares the same key. Background route and weather imports follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. Settings → **Import route data** shows progress and starts a run by hand.

## Uploading a CSV from another container

Uploading by hand is fine for occasional refreshes. If you keep your export somewhere your network can read — a shared folder, a Nextcloud or Dropbox share, or a small companion container that uploads each new export — Crag Stats can accept it over HTTP instead. Set `CSV_INGEST_TOKEN` to a long random value, restart, and then `POST` the file:

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

A multipart upload with the file in a `file` field works too. Requests without the token are rejected, and a successful response reports how many ascents were processed and how many were new:

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

To check an install without importing anything, send a body that is not an export:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` means the endpoint is reachable and the token was accepted: it rejected the body, so nothing was written. `401` means the token did not match, while `404` means that image predates this endpoint. On a whole-UI-gated install (`AUTH_SCOPE=all`), an older image answers `401` for any unknown `/api/` path, so read `401` as "token or image".

An empty file, a login page saved by mistake, or anything over 25 MB is rejected rather than imported. This endpoint does the same upsert-only import as the Settings form, so it never removes ascents that are missing from the file. It makes no request to theCrag: the export still has to come from your own browser or another tool you control.

## Why there are no automatic CSV downloads

Crag Stats never signs in to the theCrag website or downloads exports for you. theCrag's [terms](https://www.thecrag.com/terms#ownership-and-licenses) require all programmatic access to go through the API, and every export is a full logbook dump that is costly for their servers. Exporting and uploading the CSV yourself is fine.
