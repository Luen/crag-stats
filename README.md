# Crag Stats

Self-hosted climbing analytics for [theCrag](https://www.thecrag.com/) — performance dashboards, grade pyramids, project tracking, and sync. Inspired by [Dreeve](https://dreeve.app/) (Stats for Strava) and [RoxClimbs](https://roxclimbs.com/).

**MIT licensed.** Your data stays on your machine.

## Features (MVP)

- **theCrag API sync** — personal Logbook Read API key; full reconcile on every sync (upsert + prune deletes) + daily schedule. Upstream is source of truth.
- **CSV import** — full logbook export for users without supporter API access (upsert only)
- **Dashboard** — climber type, style pyramids, notable ascents, CPR timelines, volume, height, top crags
- **Grade bands & colours** — Beginner → Elite palette aligned with [theCrag grades](https://www.thecrag.com/en/article/grades); preferred system selector
- **Logbook** — searchable / filterable ascent history with theCrag-like tick icons
- **Projects** — auto-detected from attempts
- **Docker / GHCR** — public multi-arch images (`amd64` + `arm64`) with automatic DB migrations on boot
- Provider-shaped architecture ready for Mountain Project later

Contributor / agent notes: see [AGENTS.md](./AGENTS.md) (living document).

## Quick start (local)

Requires [pnpm](https://pnpm.io/) (Node 24 LTS+).

```bash
cp .env.example .env
# optional: set THECRAG_API_KEY and APP_PASSWORD

pnpm install
pnpm test   # grade / URL / ascent mapping unit tests (also runs in CI)
pnpm check
pnpm dev
```

Open http://localhost:5173 — then **Settings** → sync API or upload CSV.

## Homeserver deploy (recommended)

Public images are published to GitHub Container Registry on each version tag / release:

`ghcr.io/luen/crag-stats:latest` (also semver tags like `v0.1.0`)

```bash
cp .env.example .env
# set THECRAG_API_KEY / SESSION_SECRET / optional APP_PASSWORD

docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

Pin a release:

```bash
CRAG_STATS_IMAGE_TAG=v0.1.0 docker compose -f docker-compose.ghcr.yml up -d
```

Upgrades:

```bash
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

**Database migrations run automatically** on container start (`scripts/docker-entrypoint.mjs` + `/migrations/*.sql`). Your SQLite volume is preserved across upgrades.

### Build locally instead

```bash
docker compose up --build -d
```

## Environment

| Variable | Purpose |
|---|---|
| `THECRAG_API_KEY` | Personal logbook read key ([docs](https://www.thecrag.com/en/article/logbookreadapi)) |
| `APP_PASSWORD` | Optional UI password gate |
| `SESSION_SECRET` | Cookie + worker shared secret |
| `DATABASE_PATH` | SQLite file path |
| `SYNC_CRON` | Cron expression (default `0 6 * * *`) |
| `PREFERRED_GRADE_SYSTEM` | `ewbank` / `french` / `yds` / `v_scale` / `font` |

## Privacy

theCrag API keys expose **private notes**. Do not commit `.env`. Revoking a key does not delete data already synced locally — use **Settings → Wipe**. See [docs/PRIVACY.md](docs/PRIVACY.md).

## Roadmap / epics

Tracked as GitHub issues on this repo (`Epic:` prefix): foundation, providers, API sync, CSV import, dashboard, analytics, projects, Mountain Project, training/wearables, docs/privacy, i18n/Crowdin.

## License

[MIT](./LICENSE)
