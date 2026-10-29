# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY patches ./patches
RUN npm install --global "$(node -p "require('./package.json').packageManager")" \
  && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build \
  && pnpm prune --prod \
  && mkdir /runtime-data /runtime-libs \
  && cp -L "$(gcc -print-file-name=libatomic.so.1)" /runtime-libs/libatomic.so.1

FROM gcr.io/distroless/cc-debian13:latest AS runner
WORKDIR /app
ENV PATH=/usr/local/bin:/usr/bin:/bin
ENV NODE_ENV=production
ENV LD_LIBRARY_PATH=/usr/local/lib
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/crag-stats.sqlite
ENV MIGRATIONS_DIR=/app/migrations
# Optional route import or CSV sync: impers downloads its pinned
# libcurl-impersonate once, on first use, into the persistent volume.
ENV IMPER_CACHE_DIR=/data/.cache/impers
ENV IMPERSONATE_CONFIG_DIR=/data/.cache/impersonate

COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /usr/local/LICENSE /usr/local/share/doc/node/LICENSE
COPY --from=build /runtime-data /data
COPY --from=build /runtime-libs/ /usr/local/lib/

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
