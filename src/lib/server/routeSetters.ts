/**
 * Route setter credits from cached `route_history` (no extra theCrag fetch).
 */
import { eq } from 'drizzle-orm';
import { climbersMentionLogin, historyTypeIsSetter } from './providers/thecrag/routeHistoryParse';
import { db, ensureSchema } from './db';
import { profiles, routeHistory, routes } from './db/schema';
import { formatBadgeDate, type SetterBadgeHit } from './badges';

const PROVIDER = 'thecrag';

function ownerLogin(provider = PROVIDER): string | null {
	ensureSchema();
	return (
		db
			.select({ login: profiles.login })
			.from(profiles)
			.where(eq(profiles.provider, provider))
			.get()?.login ?? null
	);
}

function validDay(raw: string | null | undefined): string | null {
	const s = String(raw ?? '').trim();
	if (!s) return null;
	const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
	if (!m) return null;
	const parsed = new Date(m[1] + 'T12:00:00Z');
	return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === m[1]
		? m[1]
		: null;
}

export type OwnerSetRoute = {
	routeExternalId: string;
	routeName: string | null;
	url: string | null;
	/** Earliest setter history date naming the owner (YYYY-MM-DD) */
	date: string | null;
};

/** Distinct logbook routes where cached history credits the owner as route setter. */
export function listOwnerSetRoutes(provider = PROVIDER, login?: string | null): OwnerSetRoute[] {
	ensureSchema();
	const needle = login ?? ownerLogin(provider);
	if (!needle) return [];

	const historyRows = db
		.select({
			routeExternalId: routeHistory.routeExternalId,
			type: routeHistory.type,
			climbers: routeHistory.climbers,
			historyDate: routeHistory.historyDate
		})
		.from(routeHistory)
		.where(eq(routeHistory.provider, provider))
		.all();

	const byRoute = new Map<string, { date: string | null }>();

	for (const row of historyRows) {
		if (!historyTypeIsSetter(row.type) || !climbersMentionLogin(row.climbers, needle)) continue;
		const id = row.routeExternalId;
		const day = validDay(row.historyDate);
		const prev = byRoute.get(id);
		if (!prev) {
			byRoute.set(id, { date: day });
			continue;
		}
		if (day && (!prev.date || day < prev.date)) prev.date = day;
	}

	if (!byRoute.size) return [];

	const routeMeta = db
		.select({ externalId: routes.externalId, name: routes.name, url: routes.url })
		.from(routes)
		.where(eq(routes.provider, provider))
		.all();
	const metaById = new Map(routeMeta.map((r) => [r.externalId, r]));

	const out: OwnerSetRoute[] = [];
	for (const [routeExternalId, { date }] of byRoute) {
		const meta = metaById.get(routeExternalId);
		out.push({
			routeExternalId,
			routeName: meta?.name?.trim() || null,
			url: meta?.url ?? null,
			date
		});
	}

	out.sort((a, b) => {
		const byDate = (a.date || '9999').localeCompare(b.date || '9999');
		if (byDate !== 0) return byDate;
		return (a.routeName || a.routeExternalId).localeCompare(b.routeName || b.routeExternalId);
	});
	return out;
}

export function countOwnerSetRoutes(provider = PROVIDER, login?: string | null): number {
	return listOwnerSetRoutes(provider, login).length;
}

/** Chronological setter milestones for the badge carousel. */
export function setterBadgeHits(provider = PROVIDER, login?: string | null): SetterBadgeHit[] {
	return listOwnerSetRoutes(provider, login).map((r, i) => {
		const n = i + 1;
		const date = r.date;
		const tail = r.routeName
			? `${r.routeName}${r.date ? ` · ${formatBadgeDate(r.date)}` : ''}`
			: r.date
				? formatBadgeDate(r.date)
				: null;
		const prefix =
			n === 1
				? 'First route set'
				: n === 5
					? 'Route set #5'
					: n === 10
						? 'Route set #10'
						: n === 25
							? 'Route set #25'
							: `Route set #${n}`;
		return {
			date,
			routeName: r.routeName,
			href: r.url,
			detail: tail ? `${prefix} · ${tail}` : prefix
		};
	});
}
