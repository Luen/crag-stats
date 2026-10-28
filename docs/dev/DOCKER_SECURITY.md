# Container scan and runtime tooling

Snyk Container scanned `ghcr.io/luen/crag-stats:0.6.2` on 28 October 2026. Results are package inventories, not a proof that every advisory is reachable through the app.

| Project                                                | Detected dependencies | Unique advisory IDs                      |
| ------------------------------------------------------ | --------------------- | ---------------------------------------- |
| Debian Bookworm packages                               | 91                    | 96: 1 critical, 5 high, 2 medium, 88 low |
| `/app/package.json`                                    | 8                     | 0                                        |
| Global npm tooling under `/usr/local/lib/node_modules` | 144                   | 20: 1 critical, 12 high, 7 medium        |

The global tooling includes npm's bundled undici, picomatch, ip-address and other dependencies. The app and worker start with `node scripts/*.mjs`; they do not need npm, npx, Corepack, pnpm or Yarn at runtime. The runner stage removes those global tool installations and launchers. The build stage retains the pinned package manager for install/build/prune.

## Minimal runtime mitigation (#179 / #185)

The runner uses the supported `gcr.io/distroless/cc-debian13:latest` base, containing glibc, C++ runtime libraries and CA certificates. The Node 24 executable is copied from the existing `node:24-bookworm-slim` build stage, together with production dependencies and migrations. This removes unnecessary OS utilities such as mount tools, apt and shells, rather than suppressing their findings. The runtime user remains unchanged so existing data volumes retain access.

Published `ghcr.io/luen/crag-stats:0.6.3` (and `latest`) share multi-arch manifest digest `sha256:938c58ea9dfcf20c513c29bbe85e59693897adae4156fb84359eb6e4cbe550f0`. Snyk rescans of both amd64 and arm64 on 29 October 2026, and a repeat amd64 scan on 29 October 2026 after release, report the same residual inventory:

| Project                          | Detected dependencies | Unique advisory IDs                          |
| -------------------------------- | --------------------- | -------------------------------------------- |
| Distroless Debian 13 OS packages | 14                    | 25: **0 critical, 1 high, 0 medium, 24 low** |
| Packaged `/app` application      | 8                     | 0 vulnerable paths                           |

That is down from 91 dependencies / 96 IDs (1 critical / 5 high / 2 medium / 88 low) on the Bookworm runner after package-manager removal (#183). None of the remaining OS reports lists a `fixedIn` version in these scans. **No Snyk ignores were added.** Remaining reports stay visible; this is not a claim of a vulnerability-free image. Removing global npm does not patch Node's embedded HTTP implementation.

The published runner has **no shell or package manager**. Use `node scripts/migrate.mjs` or the existing Node worker command for maintenance. Standard Compose commands need no changes. Shell-based custom commands must be adapted, and host development commands remain unchanged. Keep `node` on PATH for the entrypoint's child command and preserve the CA certificates and C++ runtime needed by native dependencies.

## Residual OS inventory (track here)

Living checklist after the #185 mitigation. Update this table when a compatible base or package rebuild changes the scan; keep full Snyk JSON outside Git.

| Bucket                     | Count (v0.6.3) | Notes                                                                                                      |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| glibc (`libc6`)            | 21 low         | No listed fixed version on the scanned Debian 13 build. Reassess on each distroless/`libc6` refresh.       |
| libstdc++ / gcc-14 runtime | 2 low          | Same: wait for compatible base updates; assess applicability, do not dismiss only because severity is low. |
| zlib (`zlib1g`)            | 1 high + 1 low | High: CVE-2026-85091 — see triage below. Low: separate quantity-validation advisory; no fixedIn listed.    |
| Other OS                   | 0              | util-linux / mount / apt / shells are gone with the Bookworm runner.                                       |

Former Bookworm critical CVE-2023-45853 is a MiniZip issue. [Debian's notes](https://security-tracker.debian.org/tracker/CVE-2023-45853) explain that Bookworm's zlib binaries do not build that vulnerable component. Do not equate source-package scanner matches with demonstrated runtime exploitability.

## CVE-2026-85091 / zlib version-range discrepancy

**Scanner finding retained:** `SNYK-DEBIAN13-ZLIB-19520500` / [CVE-2026-85091](https://security-tracker.debian.org/tracker/CVE-2026-85091) against `zlib1g` `1:1.3.dfsg+really1.3.1-1+b1` (Debian 13 / trixie). Severity high. No ignore.

**Upstream / CVE wording:** the CVE describes a heap buffer overflow in `gz_vacate()` when processing non-blocking `gzwrite()` stalls, affecting zlib **1.3.1.2 through 1.3.2**. Non-blocking `gz*` support (and `gz_vacate`) was introduced in [madler/zlib@81cc0beb](https://github.com/madler/zlib/commit/81cc0bebedd935daeb81b0b6e475d8786b51af3d) (`v1.3.1.2`). The fix landed in [madler/zlib@df84af25](https://github.com/madler/zlib/commit/df84af25dc1942490e1d1c899a07619152a46148) ([upstream discussion](https://github.com/madler/zlib/issues/1310)).

**What we ship:** Debian's package name `1.3.dfsg+really1.3.1` is upstream **1.3.1**, not 1.3.1.2. [Debian's packaged `gzwrite.c`](https://sources.debian.org/src/zlib/1:1.3.dfsg%2Breally1.3.1-1/gzwrite.c/) has **no** `gz_vacate` symbol. Independent source checks against the same trixie source (empty Debian patch series; `gz*.[ch]` matching upstream v1.3.1) are recorded on the upstream issue ([comment](https://github.com/madler/zlib/issues/1310#issuecomment-5979623265)).

**Our disposition:** for the **CVE-named `gz_vacate` / 1.3.1.2–1.3.2 path**, the installed Debian 1.3.1 binaries are **outside the named range** — source-based **not affected**. The [Debian tracker](https://security-tracker.debian.org/tracker/CVE-2026-85091) still labels trixie `vulnerable` while sid is fixed at `1:1.3.dfsg+really1.3.2-4`; Debian bug [1146895](https://bugs.debian.org/1146895) and upstream notes still discuss classification. Until the tracker and scanners agree, **keep the raw high finding** and re-check after each zlib or distroless bump.

**Milder researcher claim on 1.3.1:** the public write-up also describes a 1-byte null write in `gzvprintf` on 1.3.1 after a non-blocking stall + `gzclearerr` + `gzprintf`. That is a different, lower-severity surface than the multi-kilobyte `gz_vacate` memmove. Crag Stats does not drive zlib's `gz*` APIs over non-blocking sockets in application code (Node's own HTTP stack is separate). Still: do not ignore the Snyk ID; treat any future Debian `zlib1g` rebuild that lands a clear fix or tracker clarification as a reason to rebuild and rescan.

## Validation smoke (unchanged)

Both linux/amd64 and linux/arm64 candidates passed native SQLite, migration ledger, server startup, real sample CSV import and logbook HTTP checks with throwaway databases. The real opt-in `impers` native library also passed compressed loopback requests and default HTTPS certificate verification on both architectures, without contacting theCrag. CI builds and smoke-tests both architectures; optional `--importer` validation additionally downloads the existing pinned importer library and contacts GitHub for the TLS check.

To repeat container compatibility checks with a locally built image (from a POSIX shell):

```bash
docker run --rm --entrypoint node \
  --mount type=bind,src="$PWD/scripts/container-smoke.mjs",dst=/app/scripts/container-smoke.mjs,readonly \
  --mount type=bind,src="$PWD/samples/thecrag-logbook-sample.csv",dst=/fixtures/logbook.csv,readonly \
  -e CRAG_STATS_CONTAINER_SMOKE=1 \
  crag-stats:security-runtime scripts/container-smoke.mjs --importer
```

## Rescan after base / package updates

Run this whenever `gcr.io/distroless/cc-debian13`, the Node 24 build image, or a release tag that ships a new runner digest changes. Goal: compare unique OS advisory IDs and severities to the residual table above — not to force a green scan.

```bash
# Published multi-arch (repeat with --platform=linux/arm64 as needed)
snyk container test ghcr.io/luen/crag-stats:0.6.3 --file=Dockerfile
snyk container test ghcr.io/luen/crag-stats:0.6.3 --file=Dockerfile --platform=linux/arm64

# Local candidate before release
docker build -t crag-stats:security-runtime .
snyk container test crag-stats:security-runtime --file=Dockerfile
```

Checklist:

1. Inspect the **OS** project and each **application** project separately.
2. Count **unique advisory IDs**, not duplicate dependency paths.
3. Note whether any residual now lists a `fixedIn` / upgrade path — if yes, prefer a compatible base bump over an ignore.
4. Re-read the zlib tracker + upstream issue if the high ID remains; update the disposition paragraph if Debian reclassifies trixie.
5. Update the residual table and digest in this file in the same PR as the image bump.
6. Keep full reports outside Git; leave findings visible (no ignores for “still tracking”).
