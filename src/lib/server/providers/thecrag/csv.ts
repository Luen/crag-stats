import { parse } from 'csv-parse/sync';
import { detectAndParseGrade, parseHeightMeters } from '#lib/grades';
import { theCragAscentUrl } from '#lib/thecragUrls';
import { classifyTick, type CanonicalAscent } from '../types';

export type CsvRow = Record<string, string>;

function starsFromCsv(raw: string | undefined): number | null {
	if (!raw) return null;
	const count = (raw.match(/\*/g) || []).length;
	return count > 0 ? count : null;
}

/** True when CSV location fields place the climb in Australia. */
export function csvRowLooksAustralian(row: Pick<CsvRow, string>): boolean {
	const country = (row['Country'] ?? '').trim().toLowerCase();
	if (country === 'australia' || country === 'au') return true;
	const path = (row['Crag Path'] ?? '').trim().toLowerCase().replace(/^\/+/, '');
	if (path === 'australia' || path.startsWith('australia/') || path.startsWith('australia '))
		return true;
	const link = (row['Route Link'] ?? row['Crag Link'] ?? '').trim().toLowerCase();
	return /(?:^|\/)(?:en\/)?climbing\/australia(?:\/|$)/i.test(link);
}

/**
 * CSV has no grade-system column. AU boulder exports often use bare Ewbank digits (`9`, `1`);
 * without an AU hint those become fake V9/V1 (#112). Explicit `V5` / `VB` stay V-scale (#124).
 */
export function csvGradeSystemHint(
	row: Pick<CsvRow, string>,
	gradeRaw: string | null | undefined,
	gearStyle: string | null | undefined
): string | null {
	const text = (gradeRaw ?? '').trim();
	if (!text) return null;
	if (/^V/i.test(text) || /^VB/i.test(text)) return null;
	if (!/^\d{1,2}$/.test(text)) return null;
	const style = (gearStyle ?? '').toLowerCase();
	if (!style.includes('boulder')) return null;
	if (!csvRowLooksAustralian(row)) return null;
	return 'AU';
}

/** Map one theCrag CSV export row (also used to repair stored CSV `raw_json`). */
export function mapTheCragCsvRow(row: CsvRow): CanonicalAscent | null {
	const externalId = row['Ascent ID']?.trim();
	const routeId = row['Route ID']?.trim();
	const routeName = row['Route Name']?.trim();
	if (!externalId || !routeId || !routeName) return null;

	const tickType = row['Ascent Type']?.trim() || null;
	const { isSend, isAttempt } = classifyTick(tickType);
	const routeGradeRaw = row['Route Grade']?.trim() || null;
	const ascentGradeRaw = row['Ascent Grade']?.trim() || null;
	const gradeRaw = routeGradeRaw || ascentGradeRaw;
	const gearStyle = row['Route Gear Style']?.trim() || null;
	const ascentGearStyle = row['Ascent Gear Style']?.trim() || gearStyle;
	const routeSys = csvGradeSystemHint(row, gradeRaw, gearStyle);
	const ascentSys = csvGradeSystemHint(row, ascentGradeRaw || gradeRaw, ascentGearStyle);
	const parsed = detectAndParseGrade(gradeRaw, { gearStyle, gradeSystem: routeSys });
	const ascentParsed = detectAndParseGrade(ascentGradeRaw || gradeRaw, {
		gearStyle: ascentGearStyle,
		gradeSystem: ascentSys
	});
	const heightM = parseHeightMeters(row['Ascent Height']) ?? parseHeightMeters(row['Route Height']);

	return {
		provider: 'thecrag',
		externalId,
		route: {
			provider: 'thecrag',
			externalId: routeId,
			name: routeName,
			gradeRaw,
			gradeScore: parsed.score,
			gradeBand: parsed.band?.id ?? null,
			gradeSystem: parsed.system,
			gearStyle,
			heightM: parseHeightMeters(row['Route Height']),
			stars: starsFromCsv(row['Route Stars']),
			url: row['Route Link']?.trim() || null,
			country: row['Country']?.trim() || null,
			cragName: row['Crag Name']?.trim() || null,
			cragPath: row['Crag Path']?.trim() || null,
			areaExternalId: null
		},
		ascentDate: row['Ascent Date']?.trim() || null,
		logDate: row['Log Date']?.trim() || null,
		tickType,
		tickLabel: row['Ascent Type']?.trim() || null,
		ascentLabel: row['Ascent Label']?.trim() || null,
		ascentGearStyle: row['Ascent Gear Style']?.trim() || null,
		ascentGradeRaw,
		effectiveGradeRaw: ascentParsed.raw || ascentGradeRaw || gradeRaw,
		effectiveGradeScore: ascentParsed.score,
		effectiveGradeBand: ascentParsed.band?.id ?? null,
		pitchLabel: null,
		pitchesClimbed: null,
		pitchesTotal: null,
		ascentUrl: theCragAscentUrl(externalId),
		heightM,
		quality: row['Quality']?.trim() || null,
		partners: row['With']?.trim() || null,
		comment: row['Comment']?.trim() || null,
		isSend,
		isAttempt,
		epoch: null,
		cprBase: null,
		cprScore: null,
		rawJson: JSON.stringify(row)
	};
}

/** True when `raw_json` looks like a flat theCrag CSV export row (not an API ascent). */
export function isTheCragCsvRawJson(parsed: unknown): parsed is CsvRow {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
	const o = parsed as Record<string, unknown>;
	if ('route' in o) return false;
	return typeof o['Ascent ID'] === 'string' || typeof o['Route Grade'] === 'string';
}

export function parseTheCragCsv(file: Buffer): CanonicalAscent[] {
	const text = file.toString('utf8');
	const rows = parse(text, {
		columns: true,
		skip_empty_lines: true,
		relax_column_count: true,
		bom: true
	}) as CsvRow[];

	return rows.map(mapTheCragCsvRow).filter((a): a is CanonicalAscent => a != null);
}
