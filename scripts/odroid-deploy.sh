#!/usr/bin/env bash
# Deploy Crag Stats on Odroid (Docker + Watchtower-friendly :latest)
# Usage (on odroid): bash odroid-deploy.sh
set -euo pipefail

DIR="${HOME}/crag-stats"
HOST_PORT="${HOST_PORT:-8097}"
IMAGE_TAG="${CRAG_STATS_IMAGE_TAG:-latest}"

mkdir -p "$DIR"
cd "$DIR"

cat > docker-compose.yml <<EOF
services:
  app:
    image: ghcr.io/luen/crag-stats:\${CRAG_STATS_IMAGE_TAG:-latest}
    container_name: crag-stats
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
    ports:
      - "\${HOST_BIND:-127.0.0.1}:\${HOST_PORT:-8097}:3000"
    env_file:
      - .env
    environment:
      DATABASE_PATH: /data/crag-stats.sqlite
      MIGRATIONS_DIR: /app/migrations
      HOST: 0.0.0.0
      PORT: 3000
    volumes:
      - crag_data:/data
    restart: unless-stopped

  worker:
    image: ghcr.io/luen/crag-stats:\${CRAG_STATS_IMAGE_TAG:-latest}
    container_name: crag-stats-worker
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
    command: ['node', 'scripts/worker.mjs']
    env_file:
      - .env
    environment:
      DATABASE_PATH: /data/crag-stats.sqlite
      MIGRATIONS_DIR: /app/migrations
      APP_INTERNAL_URL: http://app:3000
    volumes:
      - crag_data:/data
    restart: unless-stopped
    depends_on:
      - app

volumes:
  crag_data:
EOF

if [[ ! -f .env ]]; then
  SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
# Optional UI password gate
APP_PASSWORD=

# Required in production
SESSION_SECRET=${SECRET}

# theCrag Logbook Read API key (Supporters)
# https://www.thecrag.com/en/article/logbookreadapi
THECRAG_API_KEY=

SYNC_CRON=0 6 * * *
PREFERRED_GRADE_SYSTEM=ewbank

# Compose host publish (loopback for Cloudflare Tunnel)
HOST_BIND=127.0.0.1
HOST_PORT=${HOST_PORT}

# Watchtower tracks :latest — pin only if you want to freeze updates
CRAG_STATS_IMAGE_TAG=${IMAGE_TAG}
EOF
  echo "Created ${DIR}/.env — edit THECRAG_API_KEY (and optional APP_PASSWORD) before first sync."
else
  echo "Keeping existing ${DIR}/.env"
fi

# Ensure image tag is latest for Watchtower unless already set
if ! grep -q '^CRAG_STATS_IMAGE_TAG=' .env; then
  echo "CRAG_STATS_IMAGE_TAG=latest" >> .env
fi

echo "Pulling ghcr.io/luen/crag-stats:${IMAGE_TAG} ..."
docker compose pull
docker compose up -d

echo
docker compose ps
echo
echo "Local check:"
curl -sI "http://127.0.0.1:${HOST_PORT}" | head -5 || true
echo
echo "Next: Cloudflare Tunnel public hostname crag.luenwarneke.com -> http://localhost:${HOST_PORT}"
echo "Then open https://crag.luenwarneke.com and set THECRAG_API_KEY in ${DIR}/.env if needed."
