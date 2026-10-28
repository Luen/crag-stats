# Privacy & data control

Crag Stats is designed for **personal self-hosting**. Your ascent history stays in a local SQLite file.

## theCrag API keys

- Personal Logbook Read keys grant **read access to your entire logbook**, including private notes.
- Store keys only in `.env` (never commit them).
- Revoking a key on theCrag stops future API access; it does **not** delete data already synced into Crag Stats.
- Use **Settings → Wipe all local data** to remove the local copy. Wipe is **local-only** — it never deletes or changes your theCrag account.
- Use **Settings → Download local logbook as CSV** to export a backup before wiping.

## Private ascent notes

Synced and imported ascents keep the note from each theCrag tick. theCrag doesn't mark notes as public or private, so Crag Stats treats them all as private:

- **Hidden by default.** The logbook doesn't show them, and logbook search doesn't match them, so search can't be used to guess note contents. Dashboard cards, share/embed images and share previews never include them.
- **Opt in** with **Settings → Show my private ascent notes**.
- **Even when on, only the owner sees them:** whoever can open Settings. With `APP_PASSWORD` set, that means logged in. Without a password, anyone who can reach the site can open Settings, so only turn notes on for offline or home-network installs.
- The CSV export in Settings always includes notes, since it's your backup.

## CSV imports

CSV/XLS exports may also include comments and partner names. Treat uploaded files like backups of personal data.

## Future providers

Mountain Project and wearable integrations are **not planned** for this project.
