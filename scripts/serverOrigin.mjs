/**
 * Pure helpers for scripts/server.mjs (unit-tested in src/lib/server/serverOrigin.test.ts).
 * See server.mjs for why the protocol needs fixing up (#47).
 */

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{
 *   protocolHeader: string,
 *   hostHeader: string | null,
 *   origin: URL | null,
 *   apply: (headers: Record<string, string | string[] | undefined>, encrypted: boolean) => void
 * }}
 */
export function resolveForwarding(env) {
	const protocolHeader = (env.PROTOCOL_HEADER || 'x-forwarded-proto').toLowerCase();
	let origin = null;
	if (env.ORIGIN) {
		try {
			origin = new URL(env.ORIGIN);
		} catch {
			console.warn(`[server] ignoring invalid ORIGIN "${env.ORIGIN}"`);
		}
	}
	// With ORIGIN, the host comes from a header we set ourselves.
	const hostHeader = origin ? 'x-crag-stats-host' : env.HOST_HEADER || null;

	return {
		protocolHeader,
		hostHeader,
		origin,
		apply(headers, encrypted) {
			if (origin) {
				headers[protocolHeader] = origin.protocol.replace(':', '');
				headers['x-crag-stats-host'] = origin.host;
				return;
			}
			if (!headers[protocolHeader]) headers[protocolHeader] = encrypted ? 'https' : 'http';
		}
	};
}
