/**
 * Dreeve-style dashboard layout: which cards show and in what order.
 * Defaults match the current dashboard. Preferences live in cookie `cs_dash_layout`.
 */

export const DASH_LAYOUT_COOKIE = 'cs_dash_layout';

export type DashWidth = 'full' | 'half' | 'quarter';

export type DashCardId =
	| 'climberType'
	| 'blurb'
	| 'streaks'
	| 'eddington'
	| 'firstAscents'
	| 'solo'
	| 'athleteProfile'
	| 'heatmap'
	| 'volume'
	| 'gradeBands'
	| 'topCrags'
	| 'tickTypes'
	| 'monthly'
	| 'yearly'
	| 'bestMonths'
	| 'badges'
	| 'goals'
	| 'projects'
	| 'trainingLoad'
	| 'sessionsPerWeek'
	| 'weekday'
	| 'milestones'
	| 'styleMix'
	| 'partners'
	| 'rockTypes'
	| 'stars'
	| 'quality'
	| 'routePopularity'
	| 'karma'
	| 'pyramids'
	| 'notable'
	| 'cpr'
	| 'hardest'
	| 'recent';

export type DashCardDef = {
	id: DashCardId;
	label: string;
	width: DashWidth;
};

export type DashLayoutItem = {
	id: DashCardId;
	enabled: boolean;
};

/** Default order/visibility — Dreeve-style: recent left, climbing story right near the top. */
export const DEFAULT_DASH_CARDS: readonly DashCardDef[] = [
	{ id: 'climberType', label: 'Climber type', width: 'full' },
	{ id: 'recent', label: 'Recent activities', width: 'half' },
	{ id: 'blurb', label: 'Climbing story', width: 'half' },
	{ id: 'badges', label: 'Badges', width: 'half' },
	{ id: 'athleteProfile', label: 'Athlete profile', width: 'half' },
	{ id: 'streaks', label: 'Streaks', width: 'half' },
	{ id: 'eddington', label: 'Eddington numbers', width: 'half' },
	{ id: 'firstAscents', label: 'First ascents', width: 'half' },
	{ id: 'hardest', label: 'Hardest sends', width: 'half' },
	{ id: 'solo', label: 'Solo climbing', width: 'full' },
	{ id: 'heatmap', label: 'Ascent calendar', width: 'full' },
	{ id: 'volume', label: 'Volume', width: 'quarter' },
	{ id: 'gradeBands', label: 'Grade bands', width: 'quarter' },
	{ id: 'topCrags', label: 'Top crags', width: 'quarter' },
	{ id: 'tickTypes', label: 'Tick types', width: 'quarter' },
	{ id: 'monthly', label: 'Monthly stats', width: 'half' },
	{ id: 'yearly', label: 'Yearly stats', width: 'half' },
	{ id: 'weekday', label: 'Weekday', width: 'half' },
	{ id: 'sessionsPerWeek', label: 'Sessions per week', width: 'half' },
	{ id: 'bestMonths', label: 'Best months', width: 'full' },
	{ id: 'goals', label: 'Active goals', width: 'half' },
	{ id: 'projects', label: 'Projects', width: 'half' },
	{ id: 'trainingLoad', label: 'Training load', width: 'half' },
	{ id: 'milestones', label: 'Milestones', width: 'half' },
	{ id: 'styleMix', label: 'Style mix', width: 'full' },
	{ id: 'partners', label: 'Partners', width: 'quarter' },
	{ id: 'rockTypes', label: 'Rock types', width: 'quarter' },
	{ id: 'stars', label: 'Stars scatter', width: 'quarter' },
	{ id: 'quality', label: 'Quality', width: 'quarter' },
	{ id: 'routePopularity', label: 'Route popularity', width: 'half' },
	{ id: 'karma', label: 'Karma', width: 'half' },
	{ id: 'pyramids', label: 'Grade pyramids', width: 'full' },
	{ id: 'notable', label: 'Notable ascents', width: 'full' },
	{ id: 'cpr', label: 'CPR timelines', width: 'full' }
] as const;

const DEF_BY_ID = new Map(DEFAULT_DASH_CARDS.map((c) => [c.id, c]));

export function defaultLayout(): DashLayoutItem[] {
	return DEFAULT_DASH_CARDS.map((c) => ({ id: c.id, enabled: true }));
}

export function cardDef(id: DashCardId): DashCardDef {
	return DEF_BY_ID.get(id) ?? { id, label: id, width: 'full' };
}

/** Merge cookie/user layout with catalog (unknown ids dropped; missing ids appended disabled=false? keep enabled true for new cards at end). */
export function normalizeLayout(raw: DashLayoutItem[] | null | undefined): DashLayoutItem[] {
	const known = new Set(DEFAULT_DASH_CARDS.map((c) => c.id));
	const seen = new Set<DashCardId>();
	const out: DashLayoutItem[] = [];

	for (const item of raw ?? []) {
		if (!known.has(item.id) || seen.has(item.id)) continue;
		seen.add(item.id);
		out.push({ id: item.id, enabled: Boolean(item.enabled) });
	}

	for (const def of DEFAULT_DASH_CARDS) {
		if (seen.has(def.id)) continue;
		// New cards added in a release appear enabled at the end (Dreeve-ish defaults).
		out.push({ id: def.id, enabled: true });
	}

	return out;
}

export function parseLayoutCookie(raw: string | undefined | null): DashLayoutItem[] {
	if (!raw) return defaultLayout();
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return defaultLayout();
		const items: DashLayoutItem[] = [];
		for (const entry of parsed) {
			if (!entry || typeof entry !== 'object') continue;
			const id = (entry as { id?: string }).id;
			const enabled = (entry as { enabled?: boolean }).enabled;
			if (typeof id !== 'string') continue;
			if (!DEF_BY_ID.has(id as DashCardId)) continue;
			items.push({ id: id as DashCardId, enabled: enabled !== false });
		}
		return normalizeLayout(items);
	} catch {
		return defaultLayout();
	}
}

/**
 * Site-wide layout (app_settings.dashboard_layout) wins; the old per-browser cookie is only a
 * fallback so an admin's pre-0.4 customisation isn't lost before they save once.
 */
export function resolveDashLayout(
	stored: string | null | undefined,
	legacyCookie?: string | null
): DashLayoutItem[] {
	if (stored) return parseLayoutCookie(stored);
	return parseLayoutCookie(legacyCookie);
}

export function serializeLayout(layout: DashLayoutItem[]): string {
	return JSON.stringify(normalizeLayout(layout).map((i) => ({ id: i.id, enabled: i.enabled })));
}

export type DashRow =
	| { kind: 'full'; id: DashCardId }
	| { kind: 'duo'; ids: [DashCardId] | [DashCardId, DashCardId] }
	| { kind: 'grid'; ids: DashCardId[] };

/** Pack enabled cards into rows using catalog widths (full / half / quarter). */
export function packLayoutRows(layout: DashLayoutItem[]): DashRow[] {
	const enabled = normalizeLayout(layout).filter((i) => i.enabled);
	const rows: DashRow[] = [];
	let i = 0;

	while (i < enabled.length) {
		const cur = enabled[i]!;
		const w = cardDef(cur.id).width;

		if (w === 'full') {
			rows.push({ kind: 'full', id: cur.id });
			i += 1;
			continue;
		}

		if (w === 'half') {
			const next = enabled[i + 1];
			if (next && cardDef(next.id).width === 'half') {
				rows.push({ kind: 'duo', ids: [cur.id, next.id] });
				i += 2;
			} else {
				rows.push({ kind: 'duo', ids: [cur.id] });
				i += 1;
			}
			continue;
		}

		// quarter — take up to 4 consecutive quarters
		const ids: DashCardId[] = [cur.id];
		i += 1;
		while (i < enabled.length && ids.length < 4 && cardDef(enabled[i]!.id).width === 'quarter') {
			ids.push(enabled[i]!.id);
			i += 1;
		}
		rows.push({ kind: 'grid', ids });
	}

	return rows;
}

export function moveLayoutItem(
	layout: DashLayoutItem[],
	id: DashCardId,
	dir: -1 | 1
): DashLayoutItem[] {
	const items = normalizeLayout(layout);
	const idx = items.findIndex((i) => i.id === id);
	if (idx < 0) return items;
	const j = idx + dir;
	if (j < 0 || j >= items.length) return items;
	const copy = [...items];
	const tmp = copy[idx]!;
	copy[idx] = copy[j]!;
	copy[j] = tmp;
	return copy;
}
