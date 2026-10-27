/**
 * Resolve theCrag account.avatar (string URL or photo object) to a display URL.
 */
export function resolveTheCragAvatar(avatar: unknown): string | null {
	if (!avatar) return null;
	if (typeof avatar === 'string') {
		const s = avatar.trim();
		if (!s) return null;
		if (/^https?:\/\//i.test(s)) return s;
		if (s.startsWith('//')) return `https:${s}`;
		return null;
	}
	if (typeof avatar === 'object') {
		const obj = avatar as Record<string, unknown>;
		for (const key of ['url', 'href', 'src']) {
			if (typeof obj[key] === 'string' && /^https?:\/\//i.test(obj[key] as string)) {
				return obj[key] as string;
			}
		}
		const hash = typeof obj.hashID === 'string' ? obj.hashID : null;
		if (hash && hash.length >= 4) {
			// e.g. https://image.thecrag.com/200x200/7f/f8/{hash}
			return `https://image.thecrag.com/200x200/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash}`;
		}
	}
	return null;
}
