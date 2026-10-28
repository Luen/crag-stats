<p align="center">
  <img src="src/lib/assets/favicon.svg" alt="Crag Stats logo" width="180" />
</p>

<h1 align="center">Crag Stats</h1>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/Luen/crag-stats?color=ea580c" /></a>
  <a href="https://github.com/Luen/crag-stats/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/Luen/crag-stats?color=ea580c" /></a>
  <a href="https://github.com/Luen/crag-stats/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Luen/crag-stats/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/Luen/crag-stats/pkgs/container/crag-stats"><img alt="Docker image on GHCR" src="https://img.shields.io/badge/ghcr.io-luen%2Fcrag--stats-1d6fa5?logo=docker&logoColor=white" /></a>
</p>

<p align="center">
  <strong>Crag Stats is a self-hosted, open-source analytics dashboard for your <a href="https://www.thecrag.com/">theCrag</a> climbing logbook.</strong>
</p>

<p align="center">
  <em>Grade pyramids, CPR, training load, projects, first ascents, badges and shareable stat cards. Your data stays on your machine.</em>
</p>

<p align="center">
  <a href="#-showcase">Showcase</a> •
  <a href="#quick-start-local">Quick start</a> •
  <a href="#homeserver-deploy-recommended">Deploy</a> •
  <a href="./docs/dev/BRANDING.md">Design guide</a>
</p>

Inspired by [Dreeve](https://dreeve.app/) (Stats for Strava) and [RoxClimbs](https://roxclimbs.com/). **MIT licensed.**

## 📸 Showcase

<p align="center">
  <img src="docs/screenshots/dashboard-light.png" alt="Dashboard, light mode" width="100%" />
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/dashboard-dark.png" alt="Dashboard, dark mode" /><br /><sub><b>Dark mode</b>: follows your OS, or toggle it in the header</sub></td>
    <td width="50%"><img src="docs/screenshots/charts.png" alt="Ascent calendar, volume, grade bands, top crags and tick types" /><br /><sub><b>Charts</b>: ascent calendar, volume, theCrag grade bands, crags and tick types</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/projects.png" alt="Auto-detected projects" /><br /><sub><b>Projects</b>: auto-detected from unsent attempts</sub></td>
    <td><img src="docs/screenshots/goals.png" alt="Goals with progress" /><br /><sub><b>Goals</b>: progress fills from your logbook</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/rewind.png" alt="Yearly rewind" /><br /><sub><b>Rewind</b>: your year at a glance</sub></td>
    <td align="center"><img src="docs/screenshots/mobile.png" alt="Mobile layout" width="55%" /><br /><sub><b>Mobile</b>: the sidebar becomes a slide-out menu, and collapses to an icon rail on desktop</sub></td>
  </tr>
</table>

## Features

### Your logbook, kept in sync

- **theCrag API sync:** uses your personal Logbook Read API key. Every sync is a full reconcile (new and edited ticks are updated, deleted ones removed), on a daily schedule. A fresh install syncs as soon as it starts. theCrag stays the source of truth.
- **CSV import** for climbers without supporter API access (adds and updates, never deletes).
- **Logbook:** search and filter by style, tick, crag, sector, grade, year and season, with theCrag-style tick icons.

### Dashboard

- **Climber type, grade pyramids** per discipline, **notable ascents**, **hardest sends** (routes and boulders ranked separately), volume, height, top crags and tick types.
- **CPR timelines:** an approximation of theCrag's Climber Performance Rating.
- **Training load:** an intensity-weighted fatigue/fitness model that flags spikes. Working an ungraded route counts as climbing at your max.
- **Eddington numbers:** send days, vertical days, and route and boulder grade indexes.
- **First ascents:** mark your FAs and FFAs in the logbook to get a card with counts, grade ranges and styles, plus badges and milestones dated by your first send.
- **Solo climbing:** top-rope solo, lead solo, free solo, deep water solo and aid solo, plus ascents with no partner tagged.
- **Badges & milestones**, streaks, a climbing-story blurb, monthly and yearly stats, style mix, partners, stars and quality, rock types.
- **Projects** auto-detected from unsent attempts. Ungraded routes get a "New route?" badge.
- **Goals** with progress bars that fill from your logbook. Only the owner can add or change them.
- **Rewind:** your year at a glance.
- **Customize the dashboard** (which cards and in what order) from Settings. Grade system is site-wide.
- **How it works** pages at `/docs` for every analytic.

### Share

- **Share & embed:** live SVG stat cards (summary, Eddington numbers, hardest sends) for blogs and forum profiles, in light or dark, with copyable HTML or Markdown. The page warns you when the site is only reachable on your local network.

### Privacy & self-hosting

- **Optional password gate** (`APP_PASSWORD` / `AUTH_SCOPE`), a search-engine visibility toggle, and a one-click wipe.
- **Private notes are hidden by default.** You can opt in to see them yourself; visitors never see them.
- **Docker / GHCR:** multi-arch images (`amd64` + `arm64`), with database migrations applied automatically on start. Upgrading straight from any older release is tested.
- **Nightly dependency updates:** in-major upgrades with a 3-day cooldown, the full test suite, then a patch release.
- **Dreeve-style UI:** light and dark themes, a collapsible sidebar and a mobile drawer.
- Provider-shaped architecture, ready for Mountain Project later.

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

Public images are published to GitHub Container Registry on each version tag (`gh release create` pushes one):

`ghcr.io/luen/crag-stats:latest`, plus version tags like `0.5.1`, `0.5` and `0` (no `v` prefix).

```bash
cp .env.example .env
# set THECRAG_API_KEY / SESSION_SECRET / optional APP_PASSWORD

docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

Pin a release:

```bash
CRAG_STATS_IMAGE_TAG=0.5 docker compose -f docker-compose.ghcr.yml up -d
```

Upgrades:

```bash
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

**Database migrations run automatically** on container start (`scripts/docker-entrypoint.mjs` + `/migrations/*.sql`). Your SQLite volume is preserved across upgrades, and you can skip releases: every pending migration is applied in order. That's covered by a test that upgrades every older schema to the latest.

### Build locally instead

```bash
docker compose up --build -d
```

## Environment

| Variable                | Purpose                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `THECRAG_API_KEY`       | Personal logbook read key ([docs](https://www.thecrag.com/en/article/logbookreadapi))                                                                                                                                      |
| `APP_PASSWORD`          | Optional UI password gate                                                                                                                                                                                                  |
| `AUTH_SCOPE`            | `settings` (default: protect admin only) or `all` (whole site; also forces search engines off)                                                                                                                             |
| `SESSION_SECRET`        | Cookie + worker shared secret                                                                                                                                                                                              |
| `DATABASE_PATH`         | SQLite file path                                                                                                                                                                                                           |
| `SYNC_CRON`             | Cron expression (default `0 6 * * *`)                                                                                                                                                                                      |
| `ORIGIN`                | Public URL, only needed behind a proxy that doesn't send `X-Forwarded-Proto` (see [DEPLOY.md](docs/DEPLOY.md#http-https-and-reverse-proxies))                                                                              |
| `DISPLAY_LOCALE` / `TZ` | Locale (default `en-AU`) and IANA time zone used to display dates and times                                                                                                                                                |
| `ROUTE_HISTORY_IMPORT`  | `true` to import FA/FFA from theCrag route history in the background (default `false`): once per route, 100 per run, ≤1 request/s. Uses browser impersonation; see [docs/dev/ROUTE_HISTORY.md](docs/dev/ROUTE_HISTORY.md). |

Grade system and private ascent notes are configured in **Settings** (stored in SQLite), not via environment variables. If an older install set `PREFERRED_GRADE_SYSTEM` or `SHOW_PRIVATE_NOTES`, the first start after upgrading copies them into Settings (unless Settings already has a value).

## Privacy

theCrag API keys expose **private notes**. Do not commit `.env`. Revoking a key does not delete data already synced locally — use **Settings → Wipe**. See [docs/PRIVACY.md](docs/PRIVACY.md).

## Roadmap / epics

Tracked as GitHub issues on this repo (`Epic:` prefix): foundation, providers, API sync, CSV import, dashboard, analytics, projects, Mountain Project, training/wearables, docs/privacy, i18n/Crowdin.

## License

[MIT](./LICENSE)
