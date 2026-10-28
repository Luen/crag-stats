# Container scan and runtime tooling

Snyk Container scanned `ghcr.io/luen/crag-stats:0.6.2` on 28 October 2026. Results are package inventories, not a proof that every advisory is reachable through the app.

| Project                                                | Detected dependencies | Unique advisory IDs                      |
| ------------------------------------------------------ | --------------------- | ---------------------------------------- |
| Debian Bookworm packages                               | 91                    | 96: 1 critical, 5 high, 2 medium, 88 low |
| `/app/package.json`                                    | 8                     | 0                                        |
| Global npm tooling under `/usr/local/lib/node_modules` | 144                   | 20: 1 critical, 12 high, 7 medium        |

The global tooling includes npm's bundled undici, picomatch, ip-address and other dependencies. The app and worker start with `node scripts/*.mjs`; they do not need npm, npx, Corepack, pnpm or Yarn at runtime. The runner stage removes those global tool installations and launchers. The build stage retains the pinned package manager for install/build/prune.

## Minimal runtime mitigation (#179)

The runner now uses the supported `gcr.io/distroless/cc-debian13:latest` base, containing glibc, C++ runtime libraries and CA certificates. The Node 24 executable is copied from the existing `node:24-bookworm-slim` build stage, together with production dependencies and migrations. This removes unnecessary OS utilities such as mount tools, apt and shells, rather than suppressing their findings. The runtime user remains unchanged so existing data volumes retain access.

On 29 October 2026, the candidate's raw OS inventory was **14 dependencies / 25 advisory IDs: no critical, one high and 24 low**, down from 91 dependencies / 96 IDs after the package-manager removal. The low reports comprise 21 glibc, two libstdc++ and one zlib advisory. Both architectures reported no application vulnerable paths among eight detected dependencies. None of the remaining OS reports lists a fixed version in these scans. Remaining reports stay visible in [#179](https://github.com/Luen/crag-stats/issues/179); this is not a claim of zero vulnerabilities. Removing global npm does not patch Node's embedded HTTP implementation.

The remaining high report is `SNYK-DEBIAN13-ZLIB-19520500` / CVE-2026-85091 against `1:1.3.dfsg+really1.3.1-1+b1`. Our source-based assessment is **not affected**: the advisory describes `gz_vacate()` introduced with non-blocking writes in upstream v1.3.1.2, but the installed Debian 1.3.1 source does not contain that function. [Debian's packaged source](https://sources.debian.org/src/zlib/1:1.3.dfsg%2Breally1.3.1-1/gzwrite.c/) and the [upstream introducing commit](https://github.com/madler/zlib/commit/81cc0bebedd935daeb81b0b6e475d8786b51af3d) provide the evidence. The [Debian tracker](https://security-tracker.debian.org/tracker/CVE-2026-85091) still labels the package vulnerable, so the raw high count is retained and no Snyk ignore was added.

The former critical CVE-2023-45853 is a MiniZip issue. [Debian's notes](https://security-tracker.debian.org/tracker/CVE-2023-45853) explain that Bookworm's zlib binaries do not build that vulnerable component. Do not equate source-package scanner matches with demonstrated runtime exploitability.

Both linux/amd64 and linux/arm64 candidates passed native SQLite, migration ledger, server startup, real sample CSV import and logbook HTTP checks with throwaway databases. The real opt-in `impers` native library also passed compressed loopback requests and default HTTPS certificate verification on both architectures, without contacting theCrag. CI now builds and smoke-tests both architectures; optional `--importer` validation additionally downloads the existing pinned importer library and contacts GitHub for the TLS check.

The published runner has **no shell or package manager**. Use `node scripts/migrate.mjs` or the existing Node worker command for maintenance. Standard Compose commands need no changes. Shell-based custom commands must be adapted, and host development commands remain unchanged. Keep `node` on PATH for the entrypoint's child command and preserve the CA certificates and C++ runtime needed by native dependencies.

To repeat container compatibility checks with a locally built image (from a POSIX shell):

```bash
docker run --rm --entrypoint node \
  --mount type=bind,src="$PWD/scripts/container-smoke.mjs",dst=/app/scripts/container-smoke.mjs,readonly \
  --mount type=bind,src="$PWD/samples/thecrag-logbook-sample.csv",dst=/fixtures/logbook.csv,readonly \
  -e CRAG_STATS_CONTAINER_SMOKE=1 \
  crag-stats:security-runtime scripts/container-smoke.mjs --importer
```

To repeat the image inventory:

```bash
snyk container test ghcr.io/luen/crag-stats:0.6.2 --file=Dockerfile
docker build -t crag-stats:security-runtime .
snyk container test crag-stats:security-runtime --file=Dockerfile
```

Inspect the OS and each application project separately, count unique advisory IDs rather than duplicate dependency paths, and retain non-zero scan results. Keep full reports outside Git.
