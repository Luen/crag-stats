import { eq } from 'drizzle-orm';
import { calendarDay } from '#lib/calendarDay';
import { logbookAreaKey, normalizeRock, type LogbookSuggestion } from '#lib/logbookSuggestions';
import { parseTagsJson } from '#lib/routeTags';
import { db, ensureSchema } from './db';
import { ascents, profiles, routes } from './db/schema';

/** Whole-logbook inventory, independent of the active filters; never selects private notes/raw JSON. */
export function logbookOptions() {
	ensureSchema();
	const logged = db
		.selectDistinct({
			id: routes.id,
			name: routes.name,
			routeProvider: routes.provider,
			externalId: routes.externalId,
			areaExternalId: routes.areaExternalId,
			cragName: routes.cragName,
			cragPath: routes.cragPath,
			parentName: routes.parentName,
			parentExternalId: routes.parentExternalId,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();
	const rocks = new Map<string, string>();
	const crags = new Map<string, LogbookSuggestion>();
	const sectors = new Map<string, LogbookSuggestion>();
	const routeOptions: LogbookSuggestion[] = [];
	for (const row of logged) {
		for (const tag of parseTagsJson(row.tagsJson)) {
			if (normalizeRock(tag.category) !== 'rock type' || !normalizeRock(tag.name)) continue;
			const key = normalizeRock(tag.name);
			const label = tag.name.trim().replace(/\s+/g, ' ');
			// Stable representative label, independent of SQLite traversal order.
			if (!rocks.has(key) || label < rocks.get(key)!) rocks.set(key, label);
		}
		const context = [row.cragName, row.parentName].filter(Boolean).join(' → ');
		const identity = `${row.routeProvider} ${row.externalId}`;
		routeOptions.push({
			value: row.name,
			key: String(row.id),
			label: `${row.name} · ${context || 'No area cached'} · ${identity}`
		});
		if (row.cragName) {
			const key = logbookAreaKey(row);
			crags.set(key, {
				value: row.cragName,
				key,
				label: `${row.cragName} · ${row.routeProvider}${row.areaExternalId ? ` ${row.areaExternalId}` : ''}`
			});
		}
		if (row.parentName) {
			const key = logbookAreaKey(row, true);
			sectors.set(key, {
				value: row.parentName,
				key,
				label: `${context} · ${row.routeProvider}${row.parentExternalId ? ` ${row.parentExternalId}` : ''}`
			});
		}
	}
	const identities = db.select({ login: profiles.login, name: profiles.name }).from(profiles).all();
	const partners = new Map<string, LogbookSuggestion>();
	const years = new Set<string>();
	for (const row of db
		.select({ partners: ascents.partners, date: ascents.ascentDate })
		.from(ascents)
		.all()) {
		const day = calendarDay(row.date);
		if (day) years.add(day.slice(0, 4));
		for (const value of (row.partners ?? '')
			.split(/[,;&/]+|\band\b/i)
			.map((p) => p.trim())
			.filter(Boolean)) {
			const identity = identities.find(
				(p) => p.login && value.toLowerCase() === `@${p.login.replace(/^@/, '')}`.toLowerCase()
			);
			const label = identity?.name ? `${identity.name} (${value})` : value;
			partners.set(value.toLowerCase(), { value, label });
		}
	}
	const sorted = (options: LogbookSuggestion[]) =>
		options.sort(
			(a, b) =>
				a.label.localeCompare(b.label, 'en') || (a.key ?? '').localeCompare(b.key ?? '', 'en')
		);
	return {
		rocks: [...rocks]
			.sort(([a], [b]) => a.localeCompare(b, 'en'))
			.map(([value, label]) => ({ value, label })),
		crags: sorted([...crags.values()]),
		sectors: sorted([...sectors.values()]),
		routes: sorted(routeOptions),
		partners: sorted([...partners.values()]),
		years: [...years].sort().reverse()
	};
}
