# Crag Stats

Self-hosted climbing analytics for [theCrag](https://www.thecrag.com/) — performance dashboards, grade pyramids, project tracking, and sync. Inspired by [Dreeve](https://dreeve.app/) (Stats for Strava) and [RoxClimbs](https://roxclimbs.com/).

**MIT licensed.** Your data stays on your machine.

## Features (MVP)

- **theCrag API sync** — personal Logbook Read API key with incremental `since` cursor + daily schedule
- **CSV import** — full logbook export for users without supporter API access
- **Dashboard** — volume, height, tick breakdown, top crags, hardest sends, grade pyramid
- **Grade bands & colours** — Beginner → Elite palette aligned with [theCrag grades](https://www.thecrag.com/en/article/grades)
- **Logbook** — searchable / filterable ascent history
- **Projects** — auto-detected from attempts
- **Docker / GHCR** — public multi-arch images (`amd64` + `arm64`) with automatic DB migrations on boot
- Provider-shaped architecture ready for Mountain Project later

## Quick start (local)

Requires [pnpm](https://pnpm.io/) (Node 22+).

```bash
cp .env.example .env
# optional: set THECRAG_API_KEY and APP_PASSWORD

pnpm install
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
