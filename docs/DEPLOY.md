# Deploying Crag Stats

## Public Docker images

Images are built by [`.github/workflows/docker-release.yml`](../.github/workflows/docker-release.yml) and pushed to:

```
ghcr.io/luen/crag-stats
```

Platforms: `linux/amd64`, `linux/arm64` (homeservers / Raspberry Pi / x86 NAS).

Triggers:

- Git tag `v*` (e.g. `git tag v0.1.0 && git push --tags`)
- GitHub Release published
- Manual `workflow_dispatch`

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

Or create a GitHub Release from the UI — the workflow publishes `latest` plus semver tags.
