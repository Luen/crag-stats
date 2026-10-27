import { detectAndParseGrade, type ParsedGrade } from '#lib/grades';

export type ApiPitch = {
	number?: number;
	grade?: string;
	gradeSystem?: string;
	gradeBand?: number;
	gradeAtom?: { grade?: string; gradeBand?: number };
	tick?: { label?: string; name?: string } | null;
	height?: number | string | [number, string];
	heightText?: string;
};

export type EffectiveGrade = {
	/** Grade string used for analytics / display */
	raw: string | null;
	score: number | null;
	band: number | null;
	system: string | null;
	/** e.g. "P1" or "P1–P2" when only some pitches were climbed */
	pitchLabel: string | null;
	pitchesClimbed: number | null;
	/** Unknown unless API sent every pitch; often equals climbed count */
	pitchesTotal: number | null;
	/** Sum of climbed pitch heights when available */
	heightM: number | null;
	partialMultipitch: boolean;
};

function pitchClimbed(p: ApiPitch): boolean {
	const t = (p.tick?.label || p.tick?.name || '').trim();
	return Boolean(t);
}

function pitchGradeText(p: ApiPitch): string | null {
	return p.grade?.trim() || p.gradeAtom?.grade?.trim() || null;
}

function formatPitchLabel(numbers: number[]): string | null {
	if (!numbers.length) return null;
	const sorted = [...new Set(numbers)].sort((a, b) => a - b);
	if (sorted.length === 1) return `P${sorted[0]}`;
	const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
	if (contiguous) return `P${sorted[0]}–P${sorted[sorted.length - 1]}`;
	return sorted.map((n) => `P${n}`).join(', ');
}

function heightFromPitch(p: ApiPitch): number | null {
	if (typeof p.height === 'number' && Number.isFinite(p.height)) return p.height;
	if (typeof p.height === 'string') {
		const n = Number(p.height.replace(/[^\d.]/g, ''));
		return Number.isFinite(n) ? n : null;
	}
	if (Array.isArray(p.height) && p.height.length) {
		const n = Number(p.height[0]);
		return Number.isFinite(n) ? n : null;
	}
	if (p.heightText) {
		const n = Number(String(p.heightText).replace(/[^\d.]/g, ''));
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function isBoulderStyle(style: string | null | undefined): boolean {
	return (style || '').toLowerCase().includes('boulder');
}

/** True when an ascent/CPR grade system fits the route's gear style. */
export function gradeSystemFitsStyle(
	gradeSystem: string | null | undefined,
	routeStyle: string | null | undefined
): boolean {
	const sys = (gradeSystem || '').toUpperCase();
	if (!sys) return true;
	const boulder = isBoulderStyle(routeStyle);
	const isBoulderSys = sys.includes('BLD') || sys === 'V' || sys.includes('FONT') || sys === 'FB';
	if (boulder) return isBoulderSys || sys === 'AU' || sys === 'EWBANK';
	// Sport/trad/etc: reject boulder V-scale CPR mirrors (caused Trad "-1" / VB rows)
	if (isBoulderSys) return false;
	return true;
}

function toEffective(parsed: ParsedGrade): Pick<EffectiveGrade, 'raw' | 'score' | 'band' | 'system'> {
	// Prefer display label (e.g. V5 for bare AU "5" on boulder) over API raw.
	return {
		raw: parsed.label || parsed.raw || null,
		score: parsed.score,
		band: parsed.band?.id ?? null,
		system: parsed.system
	};
}

/**
 * Resolve the grade that *this ascent* actually represents.
 * Multipitch: only climbed pitches count (max difficulty among them).
 * Prefer ascent grade / CPR when compatible with route style; else route grade.
 */
export function resolveEffectiveGrade(opts: {
	routeGrade?: string | null;
	routeGradeBand?: number | null;
	routeStyle?: string | null;
	climbedGearStyle?: string | null;
	ascentGrade?: string | null;
	ascentGradeSystem?: string | null;
	ascentGradeBand?: number | null;
	cprGrade?: string | null;
	cprBand?: number | null;
	pitches?: ApiPitch[] | null;
	routeHeightM?: number | null;
}): EffectiveGrade {
	const routeStyle = opts.routeStyle;
	const gearStyle = opts.climbedGearStyle ?? routeStyle;
	const pitches = opts.pitches ?? [];
	const climbed = pitches.filter(pitchClimbed);

	const parseWith = (
		raw: string | null | undefined,
		style: string | null | undefined,
		band?: number | null,
		gradeSystem?: string | null
	) =>
		detectAndParseGrade(raw, {
			gearStyle: style,
			gradeBand: band ?? null,
			gradeSystem: gradeSystem ?? null
		});

	if (climbed.length > 0) {
		let best: ParsedGrade | null = null;
		let heightSum = 0;
		let heightAny = false;
		const numbers: number[] = [];

		for (const p of climbed) {
			if (typeof p.number === 'number') numbers.push(p.number);
			const h = heightFromPitch(p);
			if (h != null) {
				heightSum += h;
				heightAny = true;
			}
			const parsed = parseWith(
				pitchGradeText(p),
				gearStyle,
				p.gradeBand ?? p.gradeAtom?.gradeBand ?? null,
				p.gradeSystem
			);
			if (parsed.score == null) continue;
			if (!best || (best.score ?? -Infinity) < parsed.score) best = parsed;
		}

		const pitchLabel = formatPitchLabel(numbers);
		const partial =
			climbed.length < pitches.length ||
			(pitches.length === climbed.length && climbed.length === 1 && (numbers[0] ?? 1) === 1);

		if (best) {
			return {
				...toEffective(best),
				pitchLabel,
				pitchesClimbed: climbed.length,
				pitchesTotal: pitches.length,
				heightM: heightAny ? heightSum : opts.routeHeightM ?? null,
				partialMultipitch: pitches.length > 0 && (partial || climbed.length === 1)
			};
		}
	}

	const routeParsed = parseWith(opts.routeGrade, routeStyle, opts.routeGradeBand, null);

	// Prefer ascent grade when its system fits the route (e.g. AU "5" on boulder → V5).
	// Skip boulder V/BLDV overlays on sport/trad (Gropefest Trad 8 + CPR VB).
	const candidates: { raw?: string | null; sys?: string | null; band?: number | null }[] = [
		{ raw: opts.ascentGrade, sys: opts.ascentGradeSystem, band: opts.ascentGradeBand },
		{ raw: opts.cprGrade, sys: null, band: opts.cprBand }
	];

	for (const c of candidates) {
		if (!c.raw) continue;
		if (!gradeSystemFitsStyle(c.sys, routeStyle)) continue;
		// Also skip when the *parsed* result is boulder-scaled but route is not
		const parsed = parseWith(c.raw, routeStyle, c.band, c.sys);
		if (!isBoulderStyle(routeStyle) && parsed.isBoulder) continue;
		if (parsed.score == null) continue;
		return {
			...toEffective(parsed),
			pitchLabel: null,
			pitchesClimbed: null,
			pitchesTotal: null,
			heightM: opts.routeHeightM ?? null,
			partialMultipitch: false
		};
	}

	return {
		...toEffective(routeParsed),
		pitchLabel: null,
		pitchesClimbed: null,
		pitchesTotal: null,
		heightM: opts.routeHeightM ?? null,
		partialMultipitch: false
	};
}

/** Recompute route-level parse (for V1/2 style fixes). */
export function parseRouteGrade(
	gradeRaw: string | null | undefined,
	opts?: { gearStyle?: string | null; gradeBand?: number | null; gradeSystem?: string | null }
) {
	return detectAndParseGrade(gradeRaw, opts);
}
