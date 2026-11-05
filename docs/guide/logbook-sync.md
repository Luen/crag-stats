# Logbook sync

Crag Stats can sync through theCrag's supporter API or download your CSV export with a saved login. Choose one mode on the server. Both use the existing schedule (`SYNC_CRON`, daily by default), **Settings → Sync now** (open **`/settings`**, or **`/login`** first when `APP_PASSWORD` is set), and Docker worker. A new installation syncs on startup when configured.

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

## API sync (default)

Set `THECRAG_API_KEY` to your supporter logbook read key. Leave `THECRAG_SYNC_MODE` unset or set it to `api`. Each sync reads the full logbook and reconciles local ascents, including deletions. This mode provides richer route, profile and multipitch data.

## Automatic CSV downloads

Set these server environment variables, then restart:

```dotenv
THECRAG_SYNC_MODE=csv
THECRAG_USERNAME=your-thecrag-username
THECRAG_PASSWORD=your-thecrag-password
SESSION_SECRET=a-long-random-secret
```

Generate `SESSION_SECRET` randomly (for example `openssl rand -hex 32`). CSV mode stays disabled if it is shorter than 16 characters or still a placeholder such as the `.env.example` value.

Use your username, not your email address. Keep `.env` private. You do not need a supporter API key for CSV downloads. This mode uses the existing `impers` HTTP client and its native library; it must be supported by your server platform. It accesses the same login form and CSV export as the website, so theCrag website changes or additional verification can interrupt it.

Each run first tries the export with saved cookies. When the session has expired, Crag Stats obtains a fresh login form and CSRF token, signs in once, downloads the export and saves the updated cookies. A valid session is reused across daily runs and server restarts. Cookies are encrypted in SQLite using `SESSION_SECRET`; the password stays in server configuration. Protect the database, backups and environment together. Changing `SESSION_SECRET` requires a new theCrag login.

Failed logins, blocks and download errors pause further attempts for at least 24 hours; repeated failures increase the pause to seven days. A longer upstream Retry-After is respected. Check the status in Settings, fix credentials or complete verification on theCrag if necessary. **Forget saved theCrag login** clears the cookie jar and pause so the next sync starts fresh. This clears local authentication; it does not revoke the remote session on theCrag. **Wipe** also clears saved authentication and cancels in-flight imports. Environment variables remain configured, so remove them to stop future scheduled downloads.

## CSV limitations

CSV sync adds and updates ascents, then **removes** local theCrag ascents that are missing from the download (the export is treated as source of truth). Before writing, it refuses the whole sync when the export looks truncated: **0 rows** against a non-empty logbook, or more than a **50% drop** when you already have **100+** local ascents (for example 1000 → 230). Fix the download, or use **Settings → Wipe** if the smaller export is genuinely correct. Invalid exports, login pages and partial HTTP responses are also refused before ingestion.

The guard checks the cache after the download finishes. Accepted exports update ascents, remove missing entries and update the profile together; a database error rolls those changes back. Manual CSV uploads remain upsert-only and never remove missing entries.

The CSV has fewer fields than the API, including less profile, route metadata and multipitch information. Switching from API to CSV can replace richer ascent fields with the CSV values. Grade calculations use the CSV parser; Australian bare boulder digits use Country / path as an AU hint so they do not become fake V-grades. Profile identity comes from `THECRAG_USERNAME` only — CSV sync clears API-only account fields (`routesTicked`, outdoor/indoor counts, avatar, raw account JSON) so a shared supporter API key used for route history cannot leave the key owner's stats on the profile. Account-level CPR and other API-only profile information are not fetched by this mode. Switching accounts requires wiping local data first.

CSV sync does not download theCrag's private ascent notes (`privateMarkdown`); only the public Comment column is imported. Settings disables turning **Show my private ascent notes** on while `THECRAG_SYNC_MODE=csv`, so the toggle is not mistaken for private-note access. If already enabled, you can always turn it off to hide stored comments and any private notes retained from an earlier API import. Stored comments and notes follow the usual owner-only visibility rules. Use API sync for privateMarkdown. Passwords, session cookies and login responses are never displayed or included in sync errors.

The cached CSV grade repair updates grades only, preserving metadata from earlier API imports. Route data import and cached FA/FFA reapplication require `THECRAG_USERNAME` to match the saved logbook login in CSV mode. A mismatch blocks those actions too; wipe local data before switching accounts.

Route-history enrichment is separate and still needs its existing opt-in configuration and a **supporter** API key. Free accounts do not expose a personal route API key in the browser, so an unpaid climber’s CSV instance can reuse a household supporter’s `THECRAG_API_KEY` for route history only — see the [household shared-key notes](https://github.com/Luen/crag-stats/blob/main/docs/dev/ROUTE_HISTORY.md#household--shared-supporter-key-with-csv-mode) on GitHub (developer detail; not bundled into `/docs`). CSV mode does not silently switch to API mode, and API failures do not trigger password login.
