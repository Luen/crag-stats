# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN corepack prepare "$(node -p "require('./package.json').packageManager")" --activate \
  && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build \
  && pnpm prune --prod

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/crag-stats.sqlite
ENV MIGRATIONS_DIR=/app/migrations

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/migrations ./migrations
COPY scripts/migrate.mjs scripts/docker-entrypoint.mjs scripts/worker.mjs scripts/server.mjs scripts/serverOrigin.mjs ./scripts/

EXPOSE 3000
VOLUME ["/data"]

ENTRYPOINT ["node", "scripts/docker-entrypoint.mjs"]
# server.mjs wraps build/ so plain-HTTP and proxied access both pass CSRF (#47).
CMD ["node", "scripts/server.mjs"]
