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

Route data import needs a saved profile login to match FA/FFA credits, which comes from API sync. Manual CSV uploads do not set it, so mark first ascents by hand in the logbook.

## Why there are no automatic CSV downloads

Crag Stats never signs in to the theCrag website or downloads exports for you. theCrag's [terms](https://www.thecrag.com/terms#ownership-and-licenses) require all programmatic access to go through the API, and every export is a full logbook dump that is costly for their servers. Exporting and uploading the CSV yourself is fine.
