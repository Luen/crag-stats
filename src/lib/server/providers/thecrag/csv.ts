import { parse } from 'csv-parse/sync';
import { detectAndParseGrade, parseHeightMeters } from '#lib/grades';
import { theCragAscentUrl } from '#lib/thecragUrls';
import { classifyTick, type CanonicalAscent } from '../types';

type CsvRow = Record<string, string>;

function starsFromCsv(raw: string | undefined): number | null {
	if (!raw) return null;
	const count = (raw.match(/\*/g) || []).length;
	return count > 0 ? count : null;
}

function mapRow(row: CsvRow): CanonicalAscent | null {
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
	const parsed = detectAndParseGrade(gradeRaw, { gearStyle });
	const ascentParsed = detectAndParseGrade(ascentGradeRaw || gradeRaw, {
		gearStyle: row['Ascent Gear Style']?.trim() || gearStyle
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

export function parseTheCragCsv(file: Buffer): CanonicalAscent[] {
	const text = file.toString('utf8');
	const rows = parse(text, {
		columns: true,
		skip_empty_lines: true,
		relax_column_count: true,
		bom: true
	}) as CsvRow[];

	return rows.map(mapRow).filter((a): a is CanonicalAscent => a != null);
}
