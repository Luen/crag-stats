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

The CSV has fewer fields than the API, including less profile, route metadata and multipitch information. Switching from API to CSV can replace richer ascent fields with the CSV values. Grade calculations use the existing CSV parser. Account-level CPR and other API-only profile information are not fetched by this mode. Switching accounts requires wiping local data first.

Private ascent comments are not in the CSV export, so the Settings toggle to show them is disabled while `THECRAG_SYNC_MODE=csv`. Manual CSV uploads behave the same way. Use API sync to import and optionally display private notes (same owner-only visibility rules as API mode). Passwords, session cookies and login responses are never displayed or included in sync errors.

Route-history enrichment is separate and still needs its existing opt-in configuration and API key. CSV mode does not silently switch to API mode, and API failures do not trigger password login.
