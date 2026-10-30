import { desc, eq } from 'drizzle-orm';
import { db } from './db';
import { ascents, routes } from './db/schema';
import { parseTagsJson } from '#lib/routeTags';
import { flattenRouteTags } from './providers/thecrag/api';
/** One-time cached metadata upgrade. Touches aspect tags only, without another provider request. */
export function repairAspectTagSources() {
	repairTagSources('Aspect');
}
/** Preserve Weather-tag provenance for explicit route sun/shade evidence. */
export function repairWeatherTagSources() {
	repairTagSources('Weather');
}
function repairTagSources(category: 'Aspect' | 'Weather') {
	const seen = new Set<number>();
	const rows = db
		.select({ routeId: ascents.routeId, rawJson: ascents.rawJson, tagsJson: routes.tagsJson })
		.from(ascents)
		.innerJoin(routes, eq(routes.id, ascents.routeId))
		.orderBy(desc(ascents.id))
		.all();
	for (const r of rows) {
		if (seen.has(r.routeId) || !r.rawJson) continue;
		let raw;
		try {
			raw = JSON.parse(r.rawJson);
		} catch {
			continue;
		}
		if (!raw?.route || typeof raw.route !== 'object') continue;
		seen.add(r.routeId);
		const tags = raw.route.tags;
		if (!tags || typeof tags !== 'object' || !Object.hasOwn(tags, category)) continue;
		const aspects = flattenRouteTags({ [category]: tags[category] });
		const other = parseTagsJson(r.tagsJson).filter(
			(t) => t.category.trim().toLowerCase() !== category.toLowerCase()
		);
		db.update(routes)
			.set({ tagsJson: JSON.stringify([...other, ...aspects]) })
			.where(eq(routes.id, r.routeId))
			.run();
	}
}
