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

/**
 * Resolve the grade that *this ascent* actually represents.
 * Multipitch: only climbed pitches count (max difficulty among them).
 * Prefer CPR base grade when pitches are absent but theCrag already adjusted.
 */
export function resolveEffectiveGrade(opts: {
	routeGrade?: string | null;
	routeGradeBand?: number | null;
	routeStyle?: string | null;
	climbedGearStyle?: string | null;
	cprGrade?: string | null;
	cprBand?: number | null;
	pitches?: ApiPitch[] | null;
	routeHeightM?: number | null;
}): EffectiveGrade {
	const gearStyle = opts.climbedGearStyle ?? opts.routeStyle;
	const pitches = opts.pitches ?? [];
	const climbed = pitches.filter(pitchClimbed);

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
			const parsed = detectAndParseGrade(pitchGradeText(p), {
				gearStyle,
				gradeBand: p.gradeBand ?? p.gradeAtom?.gradeBand ?? null
			});
			if (parsed.score == null) continue;
			if (!best || (best.score ?? -Infinity) < parsed.score) best = parsed;
		}

		const pitchLabel = formatPitchLabel(numbers);
		// Partial when API only returned climbed pitches, or climbed < listed
		const partial =
			climbed.length < pitches.length ||
			(pitches.length === climbed.length && climbed.length === 1 && (numbers[0] ?? 1) === 1);

		if (best) {
			return {
				raw: best.raw || best.label,
				score: best.score,
				band: best.band?.id ?? null,
				system: best.system,
				pitchLabel,
				pitchesClimbed: climbed.length,
				pitchesTotal: pitches.length,
				heightM: heightAny ? heightSum : opts.routeHeightM ?? null,
				// Single pitch entry on a multipitch log ⇒ treat as partial (e.g. Neon God P1)
				partialMultipitch: pitches.length > 0 && (partial || climbed.length === 1)
			};
		}

		// Climbed pitches but no parseable grades — still surface pitch label
		const fallback = detectAndParseGrade(opts.cprGrade ?? opts.routeGrade, {
			gearStyle,
			gradeBand: opts.cprBand ?? opts.routeGradeBand
		});
		return {
			raw: fallback.raw || fallback.label,
			score: fallback.score,
			band: fallback.band?.id ?? null,
			system: fallback.system,
			pitchLabel,
			pitchesClimbed: climbed.length,
			pitchesTotal: pitches.length,
			heightM: heightAny ? heightSum : opts.routeHeightM ?? null,
			partialMultipitch: true
		};
	}

	// No pitch breakdown — prefer CPR/ascent grade (theCrag effective), else route
	const preferredRaw = opts.cprGrade ?? opts.routeGrade;
	const parsed = detectAndParseGrade(preferredRaw, {
		gearStyle,
		gradeBand: opts.cprBand ?? opts.routeGradeBand
	});

	return {
		raw: parsed.raw || parsed.label || null,
		score: parsed.score,
		band: parsed.band?.id ?? null,
		system: parsed.system,
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
	opts?: { gearStyle?: string | null; gradeBand?: number | null }
) {
	return detectAndParseGrade(gradeRaw, opts);
}
