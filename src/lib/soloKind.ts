import { soloTickKind } from '#lib/soloTicks';
import type { SoloKind } from '#lib/types/dashboard';

export const SOLO_KINDS: readonly { kind: SoloKind; label: string }[] = [
	{ kind: 'toprope', label: 'Top-rope solo' },
	{ kind: 'lead', label: 'Lead solo' },
	{ kind: 'free', label: 'Free solo' },
	{ kind: 'dws', label: 'Deep water solo' },
	{ kind: 'aid', label: 'Aid solo' }
];

export function soloKind(row: {
	tickType: string | null | undefined;
	ascentGearStyle: string | null | undefined;
}): SoloKind | null {
	const explicit = soloTickKind(row.tickType);
	if (explicit) return explicit;
	const gear = (row.ascentGearStyle ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, '-');
	if (gear === 'dws' || gear === 'deep-water-solo') return 'dws';
	if (gear === 'solo' || gear === 'free-solo') return 'free';
	return null;
}

export function parseSoloKind(raw: string | null | undefined): SoloKind | '' {
	return SOLO_KINDS.find((k) => k.kind === raw)?.kind ?? '';
}
