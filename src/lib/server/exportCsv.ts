import { eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';

/** Export local logbook as a theCrag-like CSV (for backup / re-import). */
export function exportLogbookCsv(): string {
	ensureSchema();
	const rows = db
		.select({
			routeName: routes.name,
			ascentLabel: ascents.ascentLabel,
			ascentId: ascents.externalId,
			ascentUrl: ascents.ascentUrl,
			tickType: ascents.tickType,
			routeGrade: routes.gradeRaw,
			ascentGrade: ascents.ascentGradeRaw,
			routeGearStyle: routes.gearStyle,
			ascentGearStyle: ascents.ascentGearStyle,
			routeHeight: routes.heightM,
			ascentHeight: ascents.heightM,
			stars: routes.stars,
			routeId: routes.externalId,
			routeUrl: routes.url,
			country: routes.country,
			cragName: routes.cragName,
			cragUrl: routes.cragUrl,
			cragPath: routes.cragPath,
			partners: ascents.partners,
			comment: ascents.comment,
			quality: ascents.quality,
			ascentDate: ascents.ascentDate,
			logDate: ascents.logDate
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();

	const header = [
		'Route Name',
		'Ascent Label',
		'Ascent ID',
		'Ascent Link',
		'Ascent Type',
		'Route Grade',
		'Ascent Grade',
		'Route Gear Style',
		'Ascent Gear Style',
		'Route Height',
		'Ascent Height',
		'# Ascents',
		'Route Stars',
		'Route ID',
		'Route Link',
		'Country',
		'Country Link',
		'Crag Name',
		'Crag Link',
		'Crag Path',
		'With',
		'Comment',
		'Quality',
		'Ascent Date',
		'Log Date',
		'Shot'
	];

	const lines = [header.join(',')];
	for (const r of rows) {
		const stars =
			r.stars == null ? '' : r.stars <= 0 ? '' : '*'.repeat(Math.min(3, Math.max(0, r.stars)));
		const cells = [
			r.routeName,
			r.ascentLabel ?? '',
			r.ascentId,
			r.ascentUrl ?? '',
			r.tickType ?? '',
			r.routeGrade ?? '',
			r.ascentGrade ?? '',
			r.routeGearStyle ?? '',
			r.ascentGearStyle ?? '',
			r.routeHeight != null ? `${r.routeHeight}m` : '',
			r.ascentHeight != null ? `${r.ascentHeight}m` : '',
			'',
			stars,
			r.routeId,
			r.routeUrl ?? '',
			r.country ?? '',
			'',
			r.cragName ?? '',
			r.cragUrl ?? '',
			r.cragPath ?? '',
			r.partners ?? '',
			r.comment ?? '',
			r.quality ?? '',
			r.ascentDate ?? '',
			r.logDate ?? '',
			''
		];
		lines.push(cells.map(csvEscape).join(','));
	}
	return lines.join('\n');
}

function csvEscape(value: string | number | null | undefined): string {
	const s = value == null ? '' : String(value);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}
