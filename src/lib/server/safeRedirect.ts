/**
 * Only allow same-origin relative paths. Blocks `//evil`, schemes, and escapes.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/'): string {
	if (!next) return fallback;
	const trimmed = next.trim();
	if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
	if (trimmed.includes('\\') || trimmed.includes('\0') || trimmed.includes('@')) return fallback;
	try {
		const u = new URL(trimmed, 'http://local.invalid');
		if (u.origin !== 'http://local.invalid') return fallback;
		return `${u.pathname}${u.search}${u.hash}` || fallback;
	} catch {
		return fallback;
	}
}
