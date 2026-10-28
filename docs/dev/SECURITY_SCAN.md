# Snyk scan and triage

On 28 October 2026, Snyk CLI 1.1304.0 scanned the application dependency graph at v0.6.1, including development dependencies: **309 dependencies, five advisories, 48 vulnerable paths**. The separate source scan reported three findings. These are dependency inventory and static-analysis results, not proof of runtime exploitability.

## Dependency advisories

| Package         | Severity / advisory                                                                                                                                                                                                             | Reported paths                            | Follow-up                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| deepmerge 4.3.1 | Medium: [prototype pollution](https://security.snyk.io/vuln/SNYK-JS-DEEPMERGE-19964053)                                                                                                                                         | 3 through Svelte build tooling            | [#174](https://github.com/Luen/crag-stats/issues/174) |
| picomatch 4.0.7 | High: [repeated-extglob ReDoS](https://security.snyk.io/vuln/SNYK-JS-PICOMATCH-21248802)                                                                                                                                        | 30 through Vite, Vitest and other tooling | [#175](https://github.com/Luen/crag-stats/issues/175) |
| uri-js 4.4.1    | High: [infinite loop](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963963); medium: [decoding](https://security.snyk.io/vuln/SNYK-JS-URIJS-19963961), [mailto exception](https://security.snyk.io/vuln/SNYK-JS-URIJS-20341609) | 5 per advisory through ESLint → Ajv 6     | [#176](https://github.com/Luen/crag-stats/issues/176) |

At scan time Snyk listed no fixed version or patch for these advisories. The reported dependency paths are rooted in this project's declared `devDependencies`. No application request path exploiting them was demonstrated; that is not a complete reachability assessment. Do not force a different dependency major, downgrade, or add blanket ignores just to obtain a green report. Evaluate compatible upstream fixes and keep the issues open until remediation is verified.

## Source findings

- **Browser-test password:** replace the committed shared password with a random password per Playwright run. Generate the test session secret too. The parent config stores these in `CRAG_STATS_E2E_PASSWORD` / `CRAG_STATS_E2E_SESSION_SECRET` so servers and workers share the same values. These variables are test-only; production does not read them. Never put a real deployment credential in them.
- **Route-history test API key:** `test-key` in `routeHistoryEngine.test.ts` is synthetic input to the offline fake client. That suite makes no network calls. It is not a leaked provider key; retain the fixture and report this as a false positive rather than hiding the test from scanning.
- **Docker entrypoint command injection:** `scripts/docker-entrypoint.mjs` launches the operator-supplied container command with `spawn(executable, argumentArray)`. [Node's default](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) is `shell: false`; the arguments are not joined into a shell string. This is an intentional container entrypoint interface, not input from an HTTP request. The reported shell-injection path is a false positive under that execution model. Preserve argument-array execution and never introduce `shell: true` or shell-string concatenation here.

A source rescan after generating the browser-test credentials reported **two findings**, down from three: the synthetic API-key fixture and the entrypoint finding above. No ignores were added. Dependency versions were not changed; all five dependency advisories remain unresolved.

## Reproducing the application dependency scan

The installed Snyk CLI cannot parse this repo's pnpm 12 lockfile directly: it fails with “expected a single document in the stream, but found more”. [pnpm documents](https://pnpm.io/lockfile) the first document as the package-manager/config boot graph and the last as the application graph.

For the application scan, copy `package.json` and the **last** lockfile document to a temporary directory, leaving the committed files unchanged. For example, in PowerShell from the repository root:

```powershell
$scanDir = Join-Path ([IO.Path]::GetTempPath()) ('crag-stats-snyk-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $scanDir | Out-Null
Copy-Item -LiteralPath package.json -Destination (Join-Path $scanDir 'package.json')
$documents = (Get-Content pnpm-lock.yaml -Raw) -split '(?m)^---[ \t]*\r?$'
[IO.File]::WriteAllText((Join-Path $scanDir 'pnpm-lock.yaml'), $documents[-1])
snyk test --file="$scanDir/pnpm-lock.yaml" --package-manager=pnpm --dev
```

This scans the locked application graph without re-resolving dependencies. **It does not scan the pnpm boot/config graph.** The boot document currently contains the pinned pnpm tool and platform binaries; it must be covered separately or by a scanner that supports both documents before claiming full lockfile coverage. Do not rewrite the repo lockfile into a single document or switch package managers as a scanner workaround.

For source analysis, use `snyk code test --remote-repo-url=https://github.com/Luen/crag-stats`. Scan reports and temporary manifests should remain outside Git; do not commit full reports containing source context or local paths.

The dependency scan also reported that the organisation had reached its monthly private-test allowance. Findings above were returned, but further dependency rescans may require the allowance to reset or an account change by its owner. Do not claim the dependency scan is clean or that the boot graph was scanned.
