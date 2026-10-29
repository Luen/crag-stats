# Logbook sync

Crag Stats can sync through theCrag's supporter API or download your CSV export with a saved login. Choose one mode on the server. Both use the existing schedule (`SYNC_CRON`, daily by default), **Settings → Sync now**, and Docker worker. A new installation syncs on startup when configured.

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

CSV sync adds and updates ascents. It never removes local ascents missing from the download. API mode remains the choice for full deletion reconciliation. Invalid exports, login pages and partial HTTP responses are refused before ingestion.

The CSV has fewer fields than the API, including less profile, route metadata and multipitch information. Switching from API to CSV can replace richer ascent fields with the CSV values. Grade calculations use the CSV parser; Australian bare boulder digits use Country / path as an AU hint so they do not become fake V-grades. Profile identity comes from `THECRAG_USERNAME` only — CSV sync clears API-only account fields (`routesTicked`, outdoor/indoor counts, avatar, raw account JSON) so a shared supporter API key used for route history cannot leave the key owner's stats on the profile. Account-level CPR and other API-only profile information are not fetched by this mode. Switching accounts requires wiping local data first.

CSV sync does not download theCrag's private ascent notes (`privateMarkdown`); only the public Comment column is imported. Settings disables turning **Show my private ascent notes** on while `THECRAG_SYNC_MODE=csv`, so the toggle is not mistaken for private-note access. If already enabled, you can always turn it off to hide stored comments and any private notes retained from an earlier API import. Stored comments and notes follow the usual owner-only visibility rules. Use API sync for privateMarkdown. Passwords, session cookies and login responses are never displayed or included in sync errors.

The cached CSV grade repair updates grades only, preserving metadata from earlier API imports. Route-history import and cached FA/FFA reapplication require `THECRAG_USERNAME` to match the saved logbook login in CSV mode. A mismatch blocks those actions too; wipe local data before switching accounts.

Route-history enrichment is separate and still needs its existing opt-in configuration and a **supporter** API key. Free accounts do not expose a personal route API key in the browser, so an unpaid climber’s CSV instance can reuse a household supporter’s `THECRAG_API_KEY` for route history only — see [`docs/dev/ROUTE_HISTORY.md`](../dev/ROUTE_HISTORY.md#household--shared-supporter-key-with-csv-mode). CSV mode does not silently switch to API mode, and API failures do not trigger password login.
