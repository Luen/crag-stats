/**
 * Whether a hostname only works on this machine or the local network (localhost, private
 * IPv4/IPv6 ranges, mDNS `.local`, single-label names). Links and embeds that point at such
 * a host won't load for anyone on the public internet.
 */
export function isPrivateHost(hostname: string): boolean {
	const h = hostname
		.trim()
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.$/, '');
	if (!h) return true;
	if (h === 'localhost' || h.endsWith('.localhost')) return true;
	if (
		h.endsWith('.local') ||
		h.endsWith('.lan') ||
		h.endsWith('.internal') ||
		h.endsWith('.home.arpa')
	)
		return true;

	const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (v4) {
		const [a, b] = [Number(v4[1]), Number(v4[2])];
		return (
			a === 10 ||
			a === 127 ||
			a === 0 ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			(a === 100 && b >= 64 && b <= 127) // CGNAT, e.g. Tailscale
		);
	}

	if (h.includes(':')) {
		// IPv6: loopback, unique local (fc00::/7), link-local (fe80::/10), IPv4-mapped private.
		if (h === '::1' || h === '::') return true;
		if (/^f[cd][0-9a-f]{0,2}:/.test(h) || /^fe[89ab][0-9a-f]?:/.test(h)) return true;
		const mapped = h.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
		return mapped ? isPrivateHost(mapped[1]) : false;
	}

	// Single-label names (e.g. "nas", "homeserver") only resolve on a LAN.
	return !h.includes('.');
}
