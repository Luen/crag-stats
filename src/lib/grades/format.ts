import { DEFAULT_LOCALE, formatMessage, type SupportedLocale } from '#lib/i18n';
import { convertFromEwbank, convertFromVScale, formatVScaleLabel } from './conversions';
import { usesVScale } from './bands';

/** Display systems for roped climbing (sport, trad, top rope, …). Scores stay Ewbank-equivalent. */
export type RouteGradeSystem = 'ewbank' | 'french' | 'yds';
/** Display systems for bouldering. Scores stay V-scale. */
export type BoulderGradeSystem = 'v_scale' | 'font';

/** The owner's display choice: one system for routes, one for boulders. */
export type DisplayGradeSystems = { route: RouteGradeSystem; boulder: BoulderGradeSystem };

export const DEFAULT_DISPLAY_SYSTEMS: DisplayGradeSystems = { route: 'ewbank', boulder: 'v_scale' };

const ROUTE_GRADE_SYSTEM_SPECS: readonly { id: RouteGradeSystem; labelKey: string }[] = [
	{ id: 'ewbank', labelKey: 'grades.systems.ewbank' },
	{ id: 'french', labelKey: 'grades.systems.french' },
	{ id: 'yds', labelKey: 'grades.systems.yds' }
];

export const ROUTE_GRADE_SYSTEMS: readonly {
	id: RouteGradeSystem;
	label: string;
	labelKey: string;
}[] = ROUTE_GRADE_SYSTEM_SPECS.map((s) => ({
	...s,
	label: formatMessage(DEFAULT_LOCALE, s.labelKey)
}));

const BOULDER_GRADE_SYSTEM_SPECS: readonly { id: BoulderGradeSystem; labelKey: string }[] = [
	{ id: 'v_scale', labelKey: 'grades.systems.v_scale' },
	{ id: 'font', labelKey: 'grades.systems.font' }
];

export const BOULDER_GRADE_SYSTEMS: readonly {
	id: BoulderGradeSystem;
	label: string;
	labelKey: string;
}[] = BOULDER_GRADE_SYSTEM_SPECS.map((s) => ({
	...s,
	label: formatMessage(DEFAULT_LOCALE, s.labelKey)
}));

export function parseRouteGradeSystem(raw: string | null | undefined): RouteGradeSystem | null {
	const v = (raw || '').trim().toLowerCase();
	return v === 'ewbank' || v === 'french' || v === 'yds' ? v : null;
}

export function parseBoulderGradeSystem(raw: string | null | undefined): BoulderGradeSystem | null {
	const v = (raw || '').trim().toLowerCase();
	return v === 'v_scale' || v === 'font' ? v : null;
}

/**
 * Map the legacy single `grade_system` value (before routes and boulders were split) to the
 * pair it used to display: a route system kept V-scale boulders, and V-scale or Font kept
 * Ewbank routes.
 */
export function displaySystemsFromLegacy(raw: string | null | undefined): DisplayGradeSystems {
	const route = parseRouteGradeSystem(raw);
	if (route) return { route, boulder: 'v_scale' };
	const boulder = parseBoulderGradeSystem(raw);
	if (boulder) return { route: 'ewbank', boulder };
	return { ...DEFAULT_DISPLAY_SYSTEMS };
}

/**
 * Resolve stored settings: the split keys win, each falling back to the legacy value.
 */
export function resolveDisplaySystems(stored: {
	route?: string | null;
	boulder?: string | null;
	legacy?: string | null;
}): DisplayGradeSystems {
	const legacy = displaySystemsFromLegacy(stored.legacy);
	return {
		route: parseRouteGradeSystem(stored.route) ?? legacy.route,
		boulder: parseBoulderGradeSystem(stored.boulder) ?? legacy.boulder
	};
}

/**
 * One-off URL overrides for shared links. `?system=` accepts either kind (a route system
 * overrides routes, `v_scale`/`font` overrides boulders); `?boulderSystem=` overrides boulders.
 */
export function applyDisplaySystemOverrides(
	base: DisplayGradeSystems,
	params: URLSearchParams
): DisplayGradeSystems {
	const out = { ...base };
	const system = params.get('system');
	const route = parseRouteGradeSystem(system);
	if (route) out.route = route;
	const boulderFromSystem = parseBoulderGradeSystem(system);
	if (boulderFromSystem) out.boulder = boulderFromSystem;
	const boulder = parseBoulderGradeSystem(params.get('boulderSystem'));
	if (boulder) out.boulder = boulder;
	return out;
}

/** Human label, e.g. "French routes, Fontainebleau (Font) boulders". */
export function describeDisplaySystems(
	systems: DisplayGradeSystems,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	const routeDef = ROUTE_GRADE_SYSTEMS.find((s) => s.id === systems.route);
	const boulderDef = BOULDER_GRADE_SYSTEMS.find((s) => s.id === systems.boulder);
	const route = routeDef ? formatMessage(locale, routeDef.labelKey) : systems.route;
	const boulder = boulderDef ? formatMessage(locale, boulderDef.labelKey) : systems.boulder;
	return formatMessage(locale, 'grades.systems.describe', { route, boulder });
}

/**
 * Display label for a stored score in the owner's chosen systems. Boulder scores are
 * V-scale; route scores are Ewbank-equivalent.
 */
export function formatGradeLabel(
	score: number,
	isBoulder: boolean,
	systems: DisplayGradeSystems,
	raw?: string | null
): string {
	if (isBoulder) {
		if (systems.boulder === 'font') return convertFromVScale(score, 'font');
		return formatVScaleLabel(score, raw);
	}
	return convertFromEwbank(score, systems.route);
}

/** An individual climb: selected-system grade first, original route text in parentheses. */
export function formatClimbGrade(
	climb: {
		gradeScore: number | null;
		gradeRaw: string | null;
		gradeSystem?: string | null;
		gearStyle?: string | null;
		effectiveGradeScore?: number | null;
		effectiveGradeRaw?: string | null;
	},
	systems: DisplayGradeSystems
): string | null {
	const score = climb.effectiveGradeScore ?? climb.gradeScore;
	const original = climb.gradeRaw?.trim() || null;
	if (score == null || !Number.isFinite(score)) return climb.effectiveGradeRaw || original;
	const label = formatGradeLabel(
		score,
		usesVScale(climb.gradeSystem, climb.gearStyle),
		systems,
		climb.effectiveGradeRaw ?? original
	);
	return original && original !== label ? `${label} (${original})` : label;
}
