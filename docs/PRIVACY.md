# Privacy & data control

Crag Stats is designed for **personal self-hosting**. Your ascent history stays in a local SQLite file.

## theCrag API keys

- Personal Logbook Read keys grant **read access to your entire logbook**, including private notes.
- Store keys only in `.env` (never commit them).
- Revoking a key on theCrag stops future API access; it does **not** delete data already synced into Crag Stats.
- Use **Settings → Wipe all local data** to remove the local copy. Wipe is **local-only** — it never deletes or changes your theCrag account.
- Use **Settings → Download local logbook as CSV** to export a backup before wiping.

## CSV imports

CSV/XLS exports may also include comments and partner names. Treat uploaded files like backups of personal data.

## Future providers

Mountain Project and wearable integrations are **not planned** for this project.
