/**
 * Dreeve-style dashboard layout: which cards show and in what order.
 * Site-wide preferences live in app_settings; cs_dash_layout is a legacy fallback.
 */

import { formatMessage } from '#lib/i18n/format';
import { DEFAULT_LOCALE } from '#lib/i18n/types';

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
	| 'weatherConditions'
	| 'weatherPerformance'
	| 'styleMix'
	| 'partners'
	| 'rockTypes'
	| 'rockPerformance'
	| 'stars'
	| 'quality'
	| 'routePopularity'
	| 'routeRepeats'
	| 'karma'
	| 'pyramids'
	| 'notable'
	| 'cpr'
	| 'hardest'
	| 'recent';

export type DashCardDef = {
	id: DashCardId;
	label: string;
	labelKey: string;
	width: DashWidth;
	defaultEnabled?: boolean;
};

export type DashLayoutItem = {
	id: DashCardId;
	enabled: boolean;
};

const DASH_CARD_SPECS: readonly Omit<DashCardDef, 'label'>[] = [
	{
		id: 'climberType',
		labelKey: 'cards.dashboardLayoutEditor.cards.climberType',
		width: 'full'
	},
	{
		id: 'recent',
		labelKey: 'cards.dashboardLayoutEditor.cards.recent',
		width: 'half'
	},
	{
		id: 'blurb',
		labelKey: 'cards.dashboardLayoutEditor.cards.blurb',
		width: 'half'
	},
	{
		id: 'badges',
		labelKey: 'cards.dashboardLayoutEditor.cards.badges',
		width: 'half'
	},
	{
		id: 'athleteProfile',
		labelKey: 'cards.dashboardLayoutEditor.cards.athleteProfile',
		width: 'half'
	},
	{
		id: 'streaks',
		labelKey: 'cards.dashboardLayoutEditor.cards.streaks',
		width: 'half'
	},
	{
		id: 'eddington',
		labelKey: 'cards.dashboardLayoutEditor.cards.eddington',
		width: 'half'
	},
	{
		id: 'firstAscents',
		labelKey: 'cards.dashboardLayoutEditor.cards.firstAscents',
		width: 'half'
	},
	{
		id: 'hardest',
		labelKey: 'cards.dashboardLayoutEditor.cards.hardest',
		width: 'half'
	},
	{
		id: 'solo',
		labelKey: 'cards.dashboardLayoutEditor.cards.solo',
		width: 'full'
	},
	{
		id: 'heatmap',
		labelKey: 'cards.dashboardLayoutEditor.cards.heatmap',
		width: 'full'
	},
	{
		id: 'volume',
		labelKey: 'cards.dashboardLayoutEditor.cards.volume',
		width: 'quarter'
	},
	{
		id: 'gradeBands',
		labelKey: 'cards.dashboardLayoutEditor.cards.gradeBands',
		width: 'quarter'
	},
	{
		id: 'topCrags',
		labelKey: 'cards.dashboardLayoutEditor.cards.topCrags',
		width: 'quarter'
	},
	{
		id: 'tickTypes',
		labelKey: 'cards.dashboardLayoutEditor.cards.tickTypes',
		width: 'quarter'
	},
	{
		id: 'monthly',
		labelKey: 'cards.dashboardLayoutEditor.cards.monthly',
		width: 'half'
	},
	{
		id: 'yearly',
		labelKey: 'cards.dashboardLayoutEditor.cards.yearly',
		width: 'half'
	},
	{
		id: 'weekday',
		labelKey: 'cards.dashboardLayoutEditor.cards.weekday',
		width: 'half'
	},
	{
		id: 'sessionsPerWeek',
		labelKey: 'cards.dashboardLayoutEditor.cards.sessionsPerWeek',
		width: 'half'
	},
	{
		id: 'bestMonths',
		labelKey: 'cards.dashboardLayoutEditor.cards.bestMonths',
		width: 'full'
	},
	{
		id: 'goals',
		labelKey: 'cards.dashboardLayoutEditor.cards.goals',
		width: 'half'
	},
	{
		id: 'projects',
		labelKey: 'cards.dashboardLayoutEditor.cards.projects',
		width: 'half'
	},
	{
		id: 'trainingLoad',
		labelKey: 'cards.dashboardLayoutEditor.cards.trainingLoad',
		width: 'half'
	},
	{
		id: 'milestones',
		labelKey: 'cards.dashboardLayoutEditor.cards.milestones',
		width: 'half'
	},
	{
		id: 'weatherConditions',
		labelKey: 'cards.dashboardLayoutEditor.cards.weatherConditions',
		width: 'half'
	},
	{
		id: 'weatherPerformance',
		labelKey: 'cards.dashboardLayoutEditor.cards.weatherPerformance',
		width: 'half'
	},
	{
		id: 'styleMix',
		labelKey: 'cards.dashboardLayoutEditor.cards.styleMix',
		width: 'full'
	},
	{
		id: 'partners',
		labelKey: 'cards.dashboardLayoutEditor.cards.partners',
		width: 'quarter'
	},
	{
		id: 'rockTypes',
		labelKey: 'cards.dashboardLayoutEditor.cards.rockTypes',
		width: 'quarter'
	},
	{
		id: 'stars',
		labelKey: 'cards.dashboardLayoutEditor.cards.stars',
		width: 'quarter'
	},
	{
		id: 'quality',
		labelKey: 'cards.dashboardLayoutEditor.cards.quality',
		width: 'quarter'
	},
	{
		id: 'rockPerformance',
		labelKey: 'cards.dashboardLayoutEditor.cards.rockPerformance',
		width: 'half'
	},
	{
		id: 'routePopularity',
		labelKey: 'cards.dashboardLayoutEditor.cards.routePopularity',
		width: 'half'
	},
	{
		id: 'routeRepeats',
		labelKey: 'cards.dashboardLayoutEditor.cards.routeRepeats',
		width: 'half'
	},
	{
		id: 'karma',
		labelKey: 'cards.dashboardLayoutEditor.cards.karma',
		width: 'half'
	},
	{
		id: 'pyramids',
		labelKey: 'cards.dashboardLayoutEditor.cards.pyramids',
		width: 'full'
	},
	{
		id: 'notable',
		labelKey: 'cards.dashboardLayoutEditor.cards.notable',
		width: 'full'
	},
	{
		id: 'cpr',
		labelKey: 'cards.dashboardLayoutEditor.cards.cpr',
		width: 'full'
	}
];

/** Default order/visibility — Dreeve-style: recent left, climbing story right near the top. */
export const DEFAULT_DASH_CARDS: readonly DashCardDef[] = DASH_CARD_SPECS.map((c) => ({
	...c,
	label: formatMessage(DEFAULT_LOCALE, c.labelKey)
}));

const DEF_BY_ID = new Map(DEFAULT_DASH_CARDS.map((c) => [c.id, c]));

export function defaultLayout(): DashLayoutItem[] {
	return DEFAULT_DASH_CARDS.map((c) => ({ id: c.id, enabled: c.defaultEnabled ?? true }));
}

export function cardDef(id: DashCardId): DashCardDef {
	return (
		DEF_BY_ID.get(id) ?? {
			id,
			label: id,
			labelKey: `cards.dashboardLayoutEditor.cards.${id}`,
			width: 'full'
		}
	);
}

/** Preserve saved choices, drop unknown IDs and append missing cards with catalog defaults. */
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
		out.push({ id: def.id, enabled: def.defaultEnabled ?? true });
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
