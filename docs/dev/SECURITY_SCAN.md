# Snyk scan and triage

On 28 October 2026, Snyk CLI 1.1304.0 scanned the application dependency graph at v0.6.1, including development dependencies: **309 dependencies, five advisories, 48 vulnerable paths**. The separate source scan reported three findings. These are dependency inventory and static-analysis results, not proof of runtime exploitability.

## Dependency advisories

| Package         | Severity / advisory                                                                                                                                                                                                             | Reported paths                            | Follow-up                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| deepmerge 4.3.1 | Medium: [prototype pollution](https://security.snyk.io/vuln/SNYK-JS-DEEPMERGE-19964053)                                                                                                                                         | 3 through Svelte build tooling            | [#174](https://github.com/Luen/crag-stats/issues/174) |
| picomatch 4.0.7 | High: [repeated-extglob ReDoS](https://security.snyk.io/vuln/SNYK-JS-PICOMATCH-21248802)                                                                                                                                        | 30 through Vite, Vitest and other tooling | [#175](https://github.com/Luen/crag-stats/issues/175) |
| uri-js 4.4.1    | High: [infinite loop](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963963); medium: [decoding](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963961), [mailto exception](https://security.snyk.io/vuln/SNYK-JS-URIJS-20341609) | 5 per advisory through ESLint → Ajv 6     | [#176](https://github.com/Luen/crag-stats/issues/176) |

Snyk lists no upstream fixed version or patch for these advisories. A production-only scan on 29 October also found deepmerge and picomatch through adapter-node → Kit → Svelte/Vite (four paths / 136 dependencies), so the earlier claim that all paths were solely rooted in devDependencies was incomplete. No application request exploit was demonstrated; this is not a complete reachability assessment. Do not force a different dependency major, downgrade, or add blanket ignores just to obtain a green report.

## Local remediation (29 October 2026)

Adapter-node is now a build dependency. Version-pinned pnpm patches address all five reported behaviors: prototype poisoning, repeated-extglob ReDoS, invalid UTF-8 decoding, Unicode separator loops and missing mailto values. See [`patches/README.md`](../../patches/README.md) for implementation, compatibility limits and removal conditions. Installed-package exploit regressions cover distributed/minified entries and bound potential hangs in subprocesses. Docker copies the patches before its frozen install, and runtime smoke tests require the build tools and patched packages to be absent.

The first remediation validation passed 484 unit tests, production build, 41 browser tests, and a fresh production-only install covering SQLite, migrations, HTTP health, CSV import and logbook rendering. CLI scans returned zero vulnerable paths across 32 production dependencies and 15 boot dependencies. The development-inclusive scan still reported five upstream-version advisories / 48 paths: locally patched code retains upstream versions. No findings or failures were suppressed. Keep #174–#176 open until an upstream fixed release or independently verified replacement removes the version-level alerts.

The source scan initially returned seven findings. Generated test credentials, the descriptive `FIRST_IMPORT_SETTING` constant, and removing the helper's arbitrary root argument reduced this to two medium findings, zero high/low and zero ignored. These remaining findings are documented false positives: the synthetic HTTP fixture binds only to `127.0.0.1`, and the container entrypoint executes trusted operator arguments with explicit `shell: false`. Preserve argument-array execution and loopback-only native importer validation; do not weaken either to silence scanning.

## Source findings

- **Browser-test password:** replace the committed shared password with a random password per Playwright run. Generate the test session secret too. The parent config stores these in `CRAG_STATS_E2E_PASSWORD` / `CRAG_STATS_E2E_SESSION_SECRET` so servers and workers share the same values. These variables are test-only; production does not read them. Never put a real deployment credential in them.
- **Route-history test API key:** the offline fake-client fixture now generates its value per run; it makes no provider network calls. Logbook-session test passwords are generated too. Neither is a deployment credential.
- **Docker entrypoint command injection:** `scripts/docker-entrypoint.mjs` launches the operator-supplied container command with `spawn(executable, argumentArray)`. [Node's default](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) is `shell: false`; the arguments are not joined into a shell string. This is an intentional container entrypoint interface, not input from an HTTP request. The reported shell-injection path is a false positive under that execution model. Preserve argument-array execution and never introduce `shell: true` or shell-string concatenation here.

A source rescan after generating the browser-test credentials reported **two findings**, down from three: the synthetic API-key fixture and the entrypoint finding above. No ignores were added. Dependency versions were not changed; all five dependency advisories remain unresolved.

## Reproducing both lockfile graph scans

The installed Snyk CLI rejects pnpm 12's multi-document lockfile. [pnpm documents](https://pnpm.io/lockfile) the first document as the package-manager/config boot graph and the last as the application graph. Both must be covered; merging them would overwrite their shared `.` importer.

After `pnpm install`, run `node scripts/snyk-projects.mjs` from the repository root. It creates separate temporary application and boot projects and prints their paths as JSON. It preserves package versions, integrity metadata and snapshots without changing the repository or resolving dependencies. For the boot project only, config/package-manager roots are projected into ordinary dependencies so Snyk can traverse them. Unsupported or conflicting graph shapes fail instead of silently skipping roots. The helper supports this repo's single-project v9.0 schema; it rejects additional workspace importers until their manifests can be projected explicitly.

Scan every emitted project. For example, in PowerShell:

```powershell
$scan = node scripts/snyk-projects.mjs | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Could not prepare Snyk projects' }
$scanFailed = $false
foreach ($project in $scan.projects) {
    snyk test --file="$($project.lockfile)" --package-manager=pnpm --dev
    if ($LASTEXITCODE -ne 0) { $scanFailed = $true }
}
if ($scanFailed) { throw 'One or more Snyk projects failed; inspect each result above' }
```

Do not let a clean boot scan hide an application scan failure. The temporary paths are under the OS temp directory; reports/manifests must stay outside Git. A single-document lockfile produces only an application project. Do not rewrite the repo lockfile or switch package managers as a scanner workaround.

The boot graph at v0.6.2 was scanned separately on 28 October 2026: **15 dependencies, no vulnerable paths found**. This is the locked pnpm tool and platform-package inventory, not an inspection of opaque code embedded in executable binaries. The application graph's five advisories remain tracked above.

For source analysis, use `snyk code test --remote-repo-url=https://github.com/Luen/crag-stats`. Scan reports and temporary manifests should remain outside Git; do not commit full reports containing source context or local paths.

The dependency scan also reported that the organisation had reached its monthly private-test allowance. Findings above were returned, but further dependency rescans may require the allowance to reset or an account change by its owner. The original application scan alone did not cover the boot graph; the separate boot result above closes that inventory gap. Do not claim all dependencies are vulnerability-free.
