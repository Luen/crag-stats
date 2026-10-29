# Dependency security patches

These version-pinned pnpm patches address the five advisories tracked in [#174](https://github.com/Luen/crag-stats/issues/174), [#175](https://github.com/Luen/crag-stats/issues/175), and [#176](https://github.com/Luen/crag-stats/issues/176). No fixed versions were published when checked on 29 October 2026. Keep the patches until compatible upstream fixes replace them.

- `deepmerge@4.3.1`: drop `__proto__` from source and target copying, including null-prototype targets and nested objects. Based on the guard in [upstream PR #274](https://github.com/TehShrike/deepmerge/pull/274). Source and distributed CJS/UMD entries are patched.
- `picomatch@4.0.7`: detect unescaped, unbounded `*` wildcards inside repeated extglob bodies, including single alternatives and nested bodies. Use the parser's existing risky-pattern literal fallback. Ordinary globs and safe extglobs retain their behavior. Unsafe repeated-wildcard patterns deliberately become literal matches, including when a caller disables the older recursion limit.
- `uri-js@4.4.1`: use strict native UTF-8 percent decoding and preserve malformed input encoded; ensure dot-segment scanning consumes Unicode separators; handle missing mailto recipient query values. ES5 and ES module entries are patched. Regenerate the minified entry from patched ES5 source using the locked esbuild tool.

`src/lib/server/dependencySecurity.test.ts` exercises installed packages and distributed/minified entry points. Potential hangs run in bounded subprocesses so missing patches fail instead of hanging the suite.

`pnpm-workspace.yaml` declares the patches and the lockfile pins their hashes. Docker copies `patches/` before its frozen install. Adapter-node is a build dependency, excluding its Svelte/Vite chain from the production prune; container smoke tests assert that the tooling packages cannot resolve.

Snyk's version-based scanner can still flag the original development package versions. Local patches are not upstream fixed releases. Preserve and disclose scan results; do not invent versions or add ignores to hide them.
