# Deploying Crag Stats

## Public Docker images

Images are built by [`.github/workflows/docker-release.yml`](../.github/workflows/docker-release.yml) and pushed to:

```
ghcr.io/luen/crag-stats
```

Platforms: `linux/amd64`, `linux/arm64` (homeservers / Raspberry Pi / x86 NAS).

Triggers:

- Git tag `v*` (e.g. `git tag v0.1.0 && git push --tags`, or `gh release create` which pushes the tag once — see #164)
- Manual `workflow_dispatch`
- `workflow_call` from the nightly deps release

Publishing a GitHub Release for an **existing** tag does **not** rebuild the image; use a new version tag or manual dispatch.

## Admin after deploy

Open **`/settings`** on your host for sync, wipe and display options. With `APP_PASSWORD` set, sign in at **`/login`** first (Settings redirects there when logged out). Prefer Cloudflare Access (or similar) in front of `/settings*` and `/login*` on public tunnels; the app password remains a second factor.

## HTTP, HTTPS and reverse proxies

The container serves plain HTTP on port 3000 and works whichever way you reach it:

- **Directly** (e.g. `http://localhost:8097` or `http://192.168.1.10:8097` on your LAN): works out of the box.
- **Behind an HTTPS proxy** that sends `X-Forwarded-Proto` (Cloudflare Tunnel, nginx, Caddy, Traefik): works out of the box.
- **Behind a proxy that doesn't send `X-Forwarded-Proto`**: set `ORIGIN=https://your.domain` in `.env`.

Why: SvelteKit rejects form posts whose `Origin` doesn't match the server's idea of its own URL (CSRF protection). The adapter assumes `https` when nothing tells it otherwise, so `scripts/server.mjs` fills in the real protocol, or uses `ORIGIN` if you set it (#47). If a form says "Cross-site POST form submissions are forbidden", set `ORIGIN`.

## Logbook sync (API or CSV)

Configure sync in `.env` before or after the first start:

- **API (default):** `THECRAG_API_KEY` — full reconcile, including deletes.
- **CSV:** `THECRAG_SYNC_MODE=csv` plus `THECRAG_USERNAME`, `THECRAG_PASSWORD`, and a real `SESSION_SECRET` — automatic CSV downloads with a saved login (no supporter key required for the logbook).

Owner-facing setup, prune guards, private-notes limits, and CSV vs API trade-offs live in the in-app guide (`/docs/logbook-sync` once the container is up; same Markdown as [`docs/guide/logbook-sync.md`](guide/logbook-sync.md)). Route-history / `impers` pacing stays in [`docs/dev/ROUTE_HISTORY.md`](dev/ROUTE_HISTORY.md).

## Upgrade path

1. `docker compose -f docker-compose.ghcr.yml pull`
2. `docker compose -f docker-compose.ghcr.yml up -d`
3. Entrypoint runs `scripts/migrate.mjs` against the mounted SQLite volume before starting the app

New SQL files under `/migrations` are applied once and recorded in `schema_migrations`. Existing ascent data is preserved.

## Creating a release

```bash
pnpm version patch   # or minor / major
git push origin main --follow-tags
```

Or create a GitHub Release from the UI **with a new `v*` tag** — the tag push publishes `latest` plus semver tags. Releasing against an already-pushed tag does not rebuild.
