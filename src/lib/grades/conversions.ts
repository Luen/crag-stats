/**
 * Grade conversion tables aligned with theCrag:
 * https://www.thecrag.com/en/article/grades
 *
 * Internal scale uses approximate Ewbanks equivalents for free climbing,
 * and V-scale for bouldering. Conversions are approximate — climbing grades
 * are subjective and regional.
 */

import { bandFromEwbank, bandFromVScale, type GradeBand } from './bands';
import {
	ewbankToTheCragScore,
	nearestTheCragGrade,
	theCragGradeScore,
	theCragScoreToEwbank,
	theCragScoreToVScale,
	vScaleToTheCragScore
} from './thecragScale';

export type GradeSystem = 'ewbank' | 'yds' | 'french' | 'uiaa' | 'v_scale' | 'font' | 'unknown';

export type ParsedGrade = {
	system: GradeSystem;
	/** Original display string */
	raw: string;
	/** Numeric difficulty for sorting / pyramids (Ewbanks-ish for routes, V for boulders) */
	score: number | null;
	/** Display label in preferred system when convertible */
	label: string;
	band: GradeBand | null;
	isBoulder: boolean;
};

/** Nearest YDS grade by theCrag score (null below 5.0). */
export function ewbankToYds(ew: number): string | null {
	return nearestTheCragGrade('YDS', ewbankToTheCragScore(ew));
}

/** Nearest French grade by theCrag score, so in-between grades like 7a+ round-trip. */
export function ewbankToFrench(ew: number): string | null {
	return nearestTheCragGrade('FR', ewbankToTheCragScore(ew));
}

export function convertFromEwbank(ew: number, system: GradeSystem): string {
	const n = Math.round(ew);
	switch (system) {
		case 'yds':
			// Below 5.0 (Ewbank 1–3) YDS has no fifth-class grade; show 5.0, never a bare Ewbank number.
			return ewbankToYds(ew) ?? (n <= 3 ? '5.0' : String(n));
		case 'french':
			return ewbankToFrench(ew) ?? String(n);
		case 'v_scale':
		case 'font':
			return convertFromVScale(ewbankToVScale(n), system);
		case 'ewbank':
		default:
			return String(n);
	}
}

/**
 * Approximate Ewbank → V-scale when theCrag stores boulder CPR in AU.
 * Tuned so AU ~10–12 land near VB+/V0 (not V10/V12).
 */
export function ewbankToVScale(ew: number): number {
	const n = Math.round(ew);
	if (n <= 8) return -1.5; // VB-
	if (n === 9) return -0.7; // VB
	if (n === 10) return -0.5; // VB+
	if (n === 11) return -0.3; // V0-
	if (n === 12) return 0; // V0
	if (n === 13) return 0.3; // V0+
	if (n === 14) return 1;
	if (n === 15) return 1.5;
	if (n === 16) return 2;
	if (n === 17) return 2.5;
	if (n === 18) return 3;
	if (n === 19) return 3.5;
	if (n === 20) return 4;
	if (n === 21) return 5;
	if (n === 22) return 5.5;
	if (n === 23) return 6;
	if (n === 24) return 7;
	if (n === 25) return 8;
	if (n === 26) return 9;
	if (n === 27) return 10;
	if (n === 28) return 11;
	if (n === 29) return 12;
	if (n === 30) return 13;
	if (n >= 31) return Math.min(17, n - 17);
	return 0;
}

export function convertFromVScale(v: number, system: GradeSystem): string {
	if (system === 'font') {
		return nearestTheCragGrade('FB', vScaleToTheCragScore(v)) ?? `V${Math.round(v)}`;
	}
	// Preserve VB± / V0± nuance instead of Math.round(-0.5) → 0 → "V0"
	if (v <= -1.25) return 'VB-';
	if (v <= -0.75) return 'VB';
	if (v <= -0.4) return 'VB+';
	if (v < 0) return 'V0-';
	const base = Math.round(v);
	const delta = v - base;
	if (delta <= -0.2) return `V${base}-`;
	if (delta >= 0.2) return `V${base}+`;
	return `V${base}`;
}

function parseEwbank(raw: string): number | null {
	const range = raw.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
	if (range) {
		return (Number(range[1]) + Number(range[2])) / 2;
	}
	// Digits only — do not match French "5a" / "6b+" (those are not Ewbank).
	const single = raw.match(/^(\d{1,2})$/);
	if (single) return Number(single[1]);
	return null;
}

function parseYds(raw: string): number | null {
	const key = raw.toLowerCase().replace(/\s+/g, '');
	const scored = theCragGradeScore('YDS', key);
	if (scored != null) return theCragScoreToEwbank(scored);
	// Letterless or +/- YDS (5.10, 5.10-, 5.11+): average the matching lettered grades.
	const m = key.match(/^(5\.\d{1,2})([+-])?$/);
	if (!m) return null;
	const letters = m[2] === '-' ? ['a', 'b'] : m[2] === '+' ? ['c', 'd'] : ['a', 'b', 'c', 'd'];
	const scores = letters
		.map((l) => theCragGradeScore('YDS', `${m[1]}${l}`))
		.filter((n): n is number => n != null);
	if (scores.length) {
		return theCragScoreToEwbank(scores.reduce((a, b) => a + b, 0) / scores.length);
	}
	// 5.0–5.9 carry no letters; a +/- only nudges them within the grade.
	const base = theCragGradeScore('YDS', m[1]);
	return base != null ? theCragScoreToEwbank(base) : null;
}

function parseFrench(raw: string): number | null {
	const scored = theCragGradeScore('FR', raw);
	return scored != null ? theCragScoreToEwbank(scored) : null;
}

/**
 * Parse Hueco V-scale, including ranges used on theCrag (V1/2, V1-2, V4/V5).
 * Ranges use the midpoint (e.g. V1/2 → 1.5).
 */
function parseVScale(raw: string): number | null {
	// Collapse whitespace first so matchers need no nested `\s*` (avoids ReDoS).
	const text = raw.trim().replace(/\s+/g, '');

	const vb = text.match(/^VB([+-])?$/i);
	if (vb) {
		if (vb[1] === '-') return -1.5;
		if (vb[1] === '+') return -0.5;
		return -1;
	}

	const range = text.match(/^V(\d+)[/\-–]V?(\d+)([+-])?$/i);
	if (range) {
		const a = Number(range[1]);
		const b = Number(range[2]);
		if (Number.isNaN(a) || Number.isNaN(b)) return null;
		let mid = (a + b) / 2;
		if (range[3] === '-') mid -= 0.15;
		if (range[3] === '+') mid += 0.15;
		return mid;
	}

	const m = text.match(/^V(\d+)([+-])?$/i);
	if (!m) return null;
	const n = Number(m[1]);
	if (Number.isNaN(n)) return null;
	if (m[2] === '-') return n - 0.3;
	if (m[2] === '+') return n + 0.3;
	return n;
}

/** Display label for a V score (preserves ranges when raw was a range). */
export function formatVScaleLabel(score: number, raw?: string | null): string {
	const compact = (raw ?? '').trim().replace(/\s+/g, '');
	const range = compact.match(/^V(\d+)[/\-–]V?(\d+)/i);
	if (range) return `V${range[1]}/${range[2]}`;
	return convertFromVScale(score, 'v_scale');
}

/** Every theCrag Font grade (1A … 9A, with +), via its score on the shared boulder scale (#444). */
function parseFont(raw: string): number | null {
	const scored = theCragGradeScore('FB', raw);
	return scored != null ? theCragScoreToVScale(scored) : null;
}

export function detectAndParseGrade(
	raw: string | null | undefined,
	opts?: {
		gearStyle?: string | null;
		gradeBand?: number | null;
		preferredSystem?: GradeSystem;
		/** theCrag gradeSystem code: AU, FR, BLDV, YDS, … */
		gradeSystem?: string | null;
	}
): ParsedGrade {
	const preferred = opts?.preferredSystem ?? 'ewbank';
	const text = (raw ?? '').trim();
	const style = (opts?.gearStyle ?? '').toLowerCase();
	const isBoulder = style.includes('boulder');

	if (!text) {
		const band =
			opts?.gradeBand != null
				? bandFromEwbank(
						opts.gradeBand <= 5 ? [6, 15, 21, 28, 35][opts.gradeBand - 1] : opts.gradeBand
					)
				: null;
		return { system: 'unknown', raw: '', score: null, label: '—', band, isBoulder };
	}

	const looksV = /^V/i.test(text);
	const sys = (opts?.gradeSystem || '').toUpperCase();
	const forceFont = sys.includes('FONT') || sys === 'FB';
	const forceBoulderGrade = isBoulder || looksV || sys.includes('BLD') || sys === 'V';
	// Only treat Font when context is boulder/font — French "5a" must not match Font "5A".
	const tryFont = isBoulder || forceFont;

	if (forceBoulderGrade || tryFont) {
		const v = parseVScale(text) ?? (tryFont ? parseFont(text) : null);
		if (v != null) {
			return {
				system: looksV || (forceBoulderGrade && !forceFont) ? 'v_scale' : 'font',
				raw: text,
				score: v,
				label: preferred === 'font' ? convertFromVScale(v, 'font') : formatVScaleLabel(v, text),
				band: bandFromVScale(v),
				isBoulder: true
			};
		}

		// AU/Ewbank system on boulder is usually a *converted* display of the
		// boulder grade (e.g. V0 shown as "12"), NOT V12. Callers should prefer
		// the route's V-scale grade; if we must parse here, map via ewbank→V.
		const sysIsAu = sys === 'AU' || sys.includes('EWBANK');
		if (isBoulder && /^\d{1,2}$/.test(text) && sysIsAu) {
			const v = ewbankToVScale(Number(text));
			return {
				system: 'v_scale',
				raw: text,
				score: v,
				label: preferred === 'font' ? convertFromVScale(v, 'font') : formatVScaleLabel(v),
				band: bandFromVScale(v),
				isBoulder: true
			};
		}

		// Boulder logged with a bare number and no AU system (e.g. Upendi "5") → V5.
		if (isBoulder && /^\d{1,2}$/.test(text) && !sysIsAu) {
			const n = Number(text);
			return {
				system: 'v_scale',
				raw: text,
				score: n,
				label: preferred === 'font' ? convertFromVScale(n, 'font') : `V${n}`,
				band: bandFromVScale(n),
				isBoulder: true
			};
		}

		// Unparseable boulder string: keep the raw label. Never treat route gradeBand
		// midpoints (Ewbank 6/15/21/28/35) as V-scores — that produced fake "V21"/"V28".
		if (forceBoulderGrade) {
			const band =
				opts?.gradeBand != null && opts.gradeBand >= 1 && opts.gradeBand <= 5
					? bandFromVScale([-1, 0, 2, 5, 8][opts.gradeBand - 1])
					: null;
			return {
				system: 'unknown',
				raw: text,
				score: null,
				label: text || '—',
				band,
				isBoulder: true
			};
		}
	}

	let ew: number | null = parseEwbank(text);
	let system: GradeSystem = 'ewbank';
	if (ew == null && /^5\./i.test(text)) {
		ew = parseYds(text);
		system = 'yds';
	}
	if (ew == null) {
		ew = parseFrench(text);
		if (ew != null) system = 'french';
	}

	if (ew != null) {
		return {
			system,
			raw: text,
			score: ew,
			label: convertFromEwbank(
				ew,
				preferred === 'v_scale' || preferred === 'font' ? 'ewbank' : preferred
			),
			band:
				opts?.gradeBand && opts.gradeBand <= 5
					? bandFromEwbank([6, 15, 21, 28, 35][opts.gradeBand - 1])
					: bandFromEwbank(ew),
			isBoulder: false
		};
	}

	// API may provide gradeBand directly (1–5) without a parseable string (routes only)
	if (opts?.gradeBand && opts.gradeBand >= 1 && opts.gradeBand <= 5) {
		const mid = [6, 15, 21, 28, 35][opts.gradeBand - 1];
		return {
			system: 'unknown',
			raw: text,
			score: mid,
			label: text || String(mid),
			band: bandFromEwbank(mid),
			isBoulder: false
		};
	}

	return {
		system: 'unknown',
		raw: text,
		score: null,
		label: text,
		band: null,
		isBoulder
	};
}

export function parseHeightMeters(raw: string | null | undefined): number | null {
	if (!raw) return null;
	const m = String(raw)
		.trim()
		.match(/^([\d.]+)\s*(m|metres|meters)?$/i);
	if (m) return Number(m[1]);
	const ft = String(raw)
		.trim()
		.match(/^([\d.]+)\s*(ft|feet)'?$/i);
	if (ft) return Number(ft[1]) * 0.3048;
	return null;
}
