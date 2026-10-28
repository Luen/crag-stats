# Container scan and runtime tooling

Snyk Container scanned `ghcr.io/luen/crag-stats:0.6.2` on 28 October 2026. Results are package inventories, not a proof that every advisory is reachable through the app.

| Project                                                | Detected dependencies | Unique advisory IDs                      |
| ------------------------------------------------------ | --------------------- | ---------------------------------------- |
| Debian Bookworm packages                               | 91                    | 96: 1 critical, 5 high, 2 medium, 88 low |
| `/app/package.json`                                    | 8                     | 0                                        |
| Global npm tooling under `/usr/local/lib/node_modules` | 144                   | 20: 1 critical, 12 high, 7 medium        |

The global tooling includes npm's bundled undici, picomatch, ip-address and other dependencies. The app and worker start with `node scripts/*.mjs`; they do not need npm, npx, Corepack, pnpm or Yarn at runtime. The runner stage removes those global tool installations and launchers. The build stage retains the pinned package manager for install/build/prune.

A local linux/amd64 build of this change was rescanned with `snyk container test crag-stats:security-runtime --file=Dockerfile`. The global npm project disappeared, removing its 20 advisory IDs from the final filesystem inventory. The application project still reported no vulnerable paths among 8 detected dependencies. The Debian results remained **96 advisory IDs**, including one critical; the image is not vulnerability-free.

The Debian scan lists no fixed versions for those findings. They remain tracked separately in [#179](https://github.com/Luen/crag-stats/issues/179); do not hide them with ignores or change libc/Node major without validating native SQLite and the opt-in importer. Removing the global npm copy of undici does not patch Node's embedded HTTP implementation.

Validation covered the full production Docker build, package-manager absence, native SQLite execution, migration ledger, server startup, real sample CSV import and logbook HTTP results. Synthetic data used a temporary database; no existing deployment volume was used. The container removed itself after the smoke test. Other architectures were not locally exercised in this check.

Runtime maintenance commands should use `node`, for example `node scripts/migrate.mjs` or the existing worker command. Package-manager CLI commands inside the published runner are no longer supported; host development commands remain unchanged.

To repeat the image inventory:

```bash
snyk container test ghcr.io/luen/crag-stats:0.6.2 --file=Dockerfile
docker build -t crag-stats:security-runtime .
snyk container test crag-stats:security-runtime --file=Dockerfile
```

Inspect the OS and each application project separately, count unique advisory IDs rather than duplicate dependency paths, and retain non-zero scan results. Keep full reports outside Git.
