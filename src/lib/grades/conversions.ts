/**
 * Grade conversion tables aligned with theCrag:
 * https://www.thecrag.com/en/article/grades
 *
 * Internal scale uses approximate Ewbanks equivalents for free climbing,
 * and V-scale for bouldering. Conversions are approximate — climbing grades
 * are subjective and regional.
 */

import { bandFromEwbank, bandFromVScale, type GradeBand } from './bands';

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

/** Ewbanks → YDS (midpoint of theCrag mapping) */
const EWBANK_TO_YDS: Record<number, string> = {
	1: '5.0',
	2: '5.0',
	3: '5.0',
	4: '5.1',
	5: '5.1',
	6: '5.2',
	7: '5.2',
	8: '5.3',
	9: '5.4',
	10: '5.4',
	11: '5.5',
	12: '5.5',
	13: '5.6',
	14: '5.7',
	15: '5.8',
	16: '5.9',
	17: '5.10a',
	18: '5.10a',
	19: '5.10b',
	20: '5.10c',
	21: '5.10d',
	22: '5.11b',
	23: '5.11c',
	24: '5.12a',
	25: '5.12b',
	26: '5.12c',
	27: '5.12d',
	28: '5.13a',
	29: '5.13b',
	30: '5.13c',
	31: '5.13d',
	32: '5.14a',
	33: '5.14b',
	34: '5.14c',
	35: '5.14d',
	36: '5.15a',
	37: '5.15b',
	38: '5.15c',
	39: '5.15d'
};

/** Ewbanks → French */
const EWBANK_TO_FRENCH: Record<number, string> = {
	1: '1a',
	2: '1b',
	3: '1c',
	4: '2a',
	5: '2b',
	6: '2c',
	7: '3a',
	8: '3b',
	9: '3c',
	// theCrag's table: Ewbank 12 ≈ 3c+, 13 ≈ 4a/4a+ (was non-monotonic: 12 → 4b, 13 → 4a).
	10: '3c',
	11: '3c+',
	12: '3c+',
	13: '4a',
	14: '4b',
	15: '4c',
	16: '5a',
	17: '5b',
	18: '5c',
	19: '6a+',
	20: '6b',
	21: '6b+',
	22: '6c',
	23: '6c+',
	24: '7a',
	25: '7b',
	26: '7b+',
	27: '7c',
	28: '7c+',
	29: '8a',
	30: '8a+',
	31: '8b',
	32: '8b+',
	33: '8c',
	34: '8c+',
	35: '9a',
	36: '9a+',
	37: '9b',
	38: '9b+',
	39: '9c'
};

const YDS_TO_EWBANK: Record<string, number> = Object.fromEntries(
	Object.entries(EWBANK_TO_YDS).map(([ew, yds]) => [yds.toLowerCase(), Number(ew)])
);

const FRENCH_TO_EWBANK: Record<string, number> = Object.fromEntries(
	Object.entries(EWBANK_TO_FRENCH).map(([ew, fr]) => [fr.toLowerCase(), Number(ew)])
);

/** V-scale → Font (approximate theCrag boulder table) */
const V_TO_FONT: Record<number, string> = {
	[-1]: '3C',
	0: '4A',
	1: '5A',
	2: '5B',
	3: '5C+',
	4: '6B',
	5: '6C',
	6: '7A',
	7: '7A+',
	8: '7B',
	9: '7B+',
	10: '7C',
	11: '8A',
	12: '8A+',
	13: '8B',
	14: '8B+',
	15: '8C',
	16: '8C+',
	17: '9A'
};

export function ewbankToYds(ew: number): string | null {
	return EWBANK_TO_YDS[Math.round(ew)] ?? null;
}

export function ewbankToFrench(ew: number): string | null {
	return EWBANK_TO_FRENCH[Math.round(ew)] ?? null;
}

export function convertFromEwbank(ew: number, system: GradeSystem): string {
	const n = Math.round(ew);
	switch (system) {
		case 'yds':
			return ewbankToYds(n) ?? String(n);
		case 'french':
			return ewbankToFrench(n) ?? String(n);
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
		const n = Math.round(v);
		return V_TO_FONT[n] ?? (n < 0 ? '1A' : `V${n}`);
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
	if (YDS_TO_EWBANK[key] != null) return YDS_TO_EWBANK[key];
	const m = key.match(/^5\.(\d{1,2})([a-d])?$/);
	if (!m) return null;
	const base = Number(m[1]);
	const letter = m[2];
	// coarse fallback
	if (base <= 5) return 4 + base;
	if (base === 6) return 13;
	if (base === 7) return 14;
	if (base === 8) return 15;
	if (base === 9) return 16;
	if (base === 10) return letter === 'a' ? 17 : letter === 'b' ? 19 : letter === 'c' ? 20 : 21;
	if (base === 11) return letter === 'a' ? 21 : letter === 'b' ? 22 : letter === 'c' ? 23 : 23;
	if (base === 12) return letter === 'a' ? 24 : letter === 'b' ? 25 : letter === 'c' ? 26 : 27;
	if (base === 13) return letter === 'a' ? 28 : letter === 'b' ? 29 : letter === 'c' ? 30 : 31;
	if (base === 14) return letter === 'a' ? 32 : letter === 'b' ? 33 : letter === 'c' ? 34 : 35;
	if (base === 15) return letter === 'a' ? 36 : letter === 'b' ? 37 : letter === 'c' ? 38 : 39;
	return null;
}

function parseFrench(raw: string): number | null {
	const key = raw.toLowerCase().replace(/\s+/g, '');
	if (FRENCH_TO_EWBANK[key] != null) return FRENCH_TO_EWBANK[key];
	return null;
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

function parseFont(raw: string): number | null {
	const key = raw.toUpperCase().replace(/\s+/g, '');
	const entry = Object.entries(V_TO_FONT).find(([, font]) => font === key);
	if (entry) return Number(entry[0]);
	return null;
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
