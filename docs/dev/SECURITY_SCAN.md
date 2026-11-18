# Snyk scan and triage

On 28 October 2026, Snyk CLI 1.1304.0 scanned the application dependency graph at v0.6.1, including development dependencies: **309 dependencies, five advisories, 48 vulnerable paths**. The separate source scan reported three findings. These are dependency inventory and static-analysis results, not proof of runtime exploitability.

## Dependency advisories

| Package         | Severity / advisory                                                                                                                                                                                                             | Reported paths                            | Follow-up                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| deepmerge 4.3.1 | Medium: [prototype pollution](https://security.snyk.io/vuln/SNYK-JS-DEEPMERGE-19964053) — **revoked 17 November 2026**                                                                                                          | 3 through Svelte build tooling            | [#174](https://github.com/Luen/crag-stats/issues/174) |
| picomatch 4.0.7 | High: [repeated-extglob ReDoS](https://security.snyk.io/vuln/SNYK-JS-PICOMATCH-21248802) — **revoked 17 November 2026**                                                                                                         | 30 through Vite, Vitest and other tooling | [#175](https://github.com/Luen/crag-stats/issues/175) |
| uri-js 4.4.1    | High: [infinite loop](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963963); medium: [decoding](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963961), [mailto exception](https://security.snyk.io/vuln/SNYK-JS-URIJS-20341609) | 5 per advisory through ESLint → Ajv 6     | [#176](https://github.com/Luen/crag-stats/issues/176) |

Snyk lists no upstream fixed version or patch for the `uri-js` advisories; the deepmerge and picomatch ones were later revoked (see [Advisory revocations — 17 November 2026](#advisory-revocations--17-november-2026)). A production-only scan on 29 October also found deepmerge and picomatch through adapter-node → Kit → Svelte/Vite (four paths / 136 dependencies), so the earlier claim that all paths were solely rooted in devDependencies was incomplete. No application request exploit was demonstrated; this is not a complete reachability assessment. Do not force a different dependency major, downgrade, or add blanket ignores just to obtain a green report.

## Local remediation (29 October 2026)

Adapter-node is now a build dependency. Version-pinned pnpm patches address all five reported behaviors: prototype poisoning, repeated-extglob ReDoS, invalid UTF-8 decoding, Unicode separator loops and missing mailto values. See [`patches/README.md`](../../patches/README.md) for implementation, compatibility limits and removal conditions. Installed-package exploit regressions cover distributed/minified entries and bound potential hangs in subprocesses. Docker copies the patches before its frozen install, and runtime smoke tests require the build tools and patched packages to be absent. (Current state: only the `uri-js` patch remains; the deepmerge and picomatch patches were retired when Snyk revoked both advisories — see [Advisory revocations — 17 November 2026](#advisory-revocations--17-november-2026).)

The first remediation validation passed 484 unit tests, production build, 41 browser tests, and a fresh production-only install covering SQLite, migrations, HTTP health, CSV import and logbook rendering. CLI scans returned zero vulnerable paths across 32 production dependencies and 15 boot dependencies. The development-inclusive scan still reported five upstream-version advisories / 48 paths: locally patched code retains upstream versions. No findings or failures were suppressed. Keep #174–#176 open until an upstream fixed release or independently verified replacement removes the version-level alerts. (#174 and #175 closed once Snyk revoked their advisories; #176 remains open while the `uri-js` advisory stands.)

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

## Dependabot recheck — 5 November 2026

Alert #11 (GHSA-g3hv-75wg-m249): minimatch 10.2.6 is replaced by 11.0.4 through a range-scoped pnpm override for the current ESLint/config-array/typescript-estree callers. Upstream v11 removes makeRe, AST and RegExp-based set entries; these callers use the retained minimatch function and Minimatch.match API. The installed-package regression exercises those APIs and bounds the advisory's globstar-parent preprocessing reproducer in a subprocess. Remove the override when the owning tools adopt a fixed release. Full lint/type/unit/build/browser checks validate this override; this is not a blanket override of older majors.

Alert #10 (GHSA-gcqx-w48m-w2h4 / CVE-2026-93753) names the same deepmerge flaw already addressed by the version-pinned patch in #227. npm still has no upstream fixed release. Installed CJS/UMD exploit tests cover null-prototype targets, malicious source and target inputs, nested merges and arrays. Keep #174 and the version-level alert open; no advisory dismissal or scanner ignore is added. The affected package remains build-only and excluded by the container smoke test. (Superseded: Snyk revoked this advisory on 17 November 2026, so the patch was retired — see below.)

## Advisory revocations — 17 November 2026

Snyk revoked both tooling advisories below as not vulnerabilities, and the reviewer found no remaining upstream fix to track, so the version-pinned patches were removed ([#174](https://github.com/Luen/crag-stats/issues/174), [#175](https://github.com/Luen/crag-stats/issues/175)):

- `SNYK-JS-DEEPMERGE-19964053` (deepmerge): revoked, and CVE-2026-93753 was rejected by the CVE List. A standalone `snyk test` of the published package reports no findings.
- `SNYK-JS-PICOMATCH-21248802` (picomatch): revoked, and CVE-2026-112366 was disputed by the maintainer. A standalone `snyk test` of the published package reports no findings.

The matching entries in `pnpm-workspace.yaml`, the two patch files and the installed-package regressions in `src/lib/server/dependencySecurity.test.ts` went with them. Only `uri-js@4.4.1` keeps a patch, because its advisory is still active with no fixed release ([#176](https://github.com/Luen/crag-stats/issues/176)); the minimatch override (#11) is unchanged.

Dependabot still lists alert #10, but its title now reads "Withdrawn Advisory: deepmerge mergeObject() …". No dismissal or scanner ignore is added; the alert closes when GitHub withdraws it.

CLI 1.1304.0 recheck on 17 November 2026 for this lockfile: the application graph reported **306 dependencies, three advisories and 15 vulnerable paths**, all `uri-js`; the boot graph reported **15 dependencies, no vulnerable paths**; the source scan reported **five results and no errors**. Do not claim the dependency graph is vulnerability-free while the `uri-js` advisory stands.

## Quota recheck — 17 November 2026

The monthly private-test allowance resets on the 14th. The PR check that failed on #311 on 31 October with `You have used your limit of private tests` now reports **success** on PR #468 head `80e51f8` (16 November 2026), described as `No manifest changes detected in 1 project`. That description means the PR changed no manifest, so no test ran: it is not a recorded clean scan. The results below come from the CLI instead.

| Scan (Snyk CLI 1.1304.0, 17 November 2026) | Dependencies | Advisories | Vulnerable paths |
| ------------------------------------------ | ------------ | ---------- | ---------------- |
| Application lockfile graph                 | 306          | 3          | 15               |
| Boot/config lockfile graph                 | 15           | 0          | 0                |

All three application advisories are `uri-js` 4.4.1 through ESLint → Ajv: [infinite loop `SNYK-JS-URIJS-19963963`](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963963) (high), [decoding `SNYK-JS-URIJS-19963961`](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963961) and [mailto exception `SNYK-JS-URIJS-20341609`](https://security.snyk.io/vuln/SNYK-JS-URIJS-20341609) (medium). Snyk still lists no fixed version, so the versions stay flagged while the version-pinned pnpm patch covers the behaviours (#176).

### Revoked advisories

Two advisories from the 28 October table are gone because Snyk revoked them, not because this repository changed anything:

- deepmerge `SNYK-JS-DEEPMERGE-19964053`: "The advisory has been revoked - it doesn't affect any version of package deepmerge". CVE-2026-93753 was rejected by the CVE List.
- picomatch `SNYK-JS-PICOMATCH-21248802`: "The advisory has been revoked - it doesn't affect any version of package picomatch". CVE-2026-112366 was disputed by the maintainer.

`snyk test deepmerge@4.3.1` and `snyk test picomatch@4.0.7` both return no findings for the published packages, so this is the advisory database rather than the projected lockfile hiding the patched keys. Keep #174 and #175 open; deleting their pnpm patches is a separate change with its own installed-package regressions, and nothing here added an ignore or dismissed a finding.

### Source scan

`snyk code test` returned six results: one error, two warnings and three notes. Generating the Playwright placeholder key removed the only error, leaving five results with no error severity.

| Severity | Rule                                | Location                                     | Disposition                                                                                                                                        |
| -------- | ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| error    | `HardcodedNonCryptoSecret`          | `playwright.config.ts:57`                    | Synthetic placeholder key that makes the cooldown UI treat theCrag as configured. Now generated per run, so the literal is gone.                   |
| note     | `HardcodedNonCryptoSecret`          | `src/lib/server/weatherAreaCache.test.ts:42` | Offline fake-client value; the test makes no provider request and it is not a deployment credential.                                               |
| warning  | `HttpToHttps`                       | `scripts/container-smoke.mjs:88`             | Synthetic importer fixture bound to `127.0.0.1`. Plain HTTP on loopback is deliberate.                                                             |
| warning  | `IndirectCommandInjection`          | `scripts/docker-entrypoint.mjs:24`           | Intentional container entrypoint: `spawn(executable, argumentArray)` with Node's default `shell: false`. No HTTP request reaches it.               |
| note     | `InsufficientPostmessageValidation` | `src/service-worker/index.ts:194`            | Service-worker `message` events come from same-origin clients. The handler rejects unknown message types and replies only on the caller's port.    |
| note     | `WebCookieSecureDisabledByDefault`  | `src/lib/i18n/context.svelte.ts:18`          | `cs_locale` stores a display preference, and the `Secure` attribute would break the documented plain-HTTP LAN deployment. No credential is stored. |

### Quota mechanics

Test limits apply to private repositories, but the CLI treats these scans as private. The projected lockfiles live under the OS temp directory with no Git remote, so both reports carry `isPrivate: true`; passing `--remote-repo-url=https://github.com/Luen/crag-stats` to `snyk test` did not change that in 1.1304.0. Snyk's documented route to free open-source tests is `snyk monitor` followed by setting the project's Git remote URL in the Snyk UI. Until a project is classified that way, budget two Open Source tests (application and boot) and one Snyk Code test per recheck, and do not re-scan in a loop.

If the PR check shows `You have used your limit of private tests` again, treat the scan as unavailable: it is neither evidence of a clean codebase nor a new vulnerability. Wait for the monthly reset, rerun the commands in "Reproducing both lockfile graph scans", and record what they return. Do not deactivate the project, add ignores, or downgrade dependencies to make the status green.
