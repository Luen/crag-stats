# Dependency security patches

These version-pinned pnpm patches address the advisories tracked in [#176](https://github.com/Luen/crag-stats/issues/176). Keep the patch until a compatible upstream fix replaces it.

- `uri-js@4.4.1`: use strict native UTF-8 percent decoding and preserve malformed input encoded; ensure dot-segment scanning consumes Unicode separators; handle missing mailto recipient query values. ES5 and ES module entries are patched. Regenerate the minified entry from patched ES5 source using the locked esbuild tool.

## Retired patches (17 November 2026)

Snyk revoked the advisories behind the former `deepmerge@4.3.1` and `picomatch@4.0.7` patches, so both patches were removed and the packages now install from their published versions:

- deepmerge `SNYK-JS-DEEPMERGE-19964053`: the advisory was revoked as not a vulnerability, and CVE-2026-93753 was rejected by the CVE List.
- picomatch `SNYK-JS-PICOMATCH-21248802`: the advisory was revoked as not a vulnerability, and CVE-2026-112366 was disputed by the maintainer.

Do not reintroduce a patch for either package without a new, still-active advisory; `docs/dev/SECURITY_SCAN.md` records the recheck that confirmed both revocations.

## Testing

`src/lib/server/dependencySecurity.test.ts` exercises installed packages and distributed/minified entry points for the remaining patches and the minimatch override. Potential hangs run in bounded subprocesses so a missing patch fails instead of hanging the suite.

`pnpm-workspace.yaml` declares the patch and the lockfile pins its hash. Docker copies `patches/` before its frozen install. Adapter-node is a build dependency, excluding its Svelte/Vite chain from the production prune; container smoke tests assert that the tooling packages cannot resolve.

Snyk's version-based scanner reports the original `uri-js` development package version. A local patch is not an upstream fixed release. Preserve and disclose scan results; do not invent versions or add ignores to hide them.
