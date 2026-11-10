import { convertFromEwbank, convertFromVScale, formatVScaleLabel } from './conversions';
import { usesVScale } from './bands';

/** Display systems for roped climbing (sport, trad, top rope, …). Scores stay Ewbank-equivalent. */
export type RouteGradeSystem = 'ewbank' | 'french' | 'yds';
/** Display systems for bouldering. Scores stay V-scale. */
export type BoulderGradeSystem = 'v_scale' | 'font';

/** The owner's display choice: one system for routes, one for boulders. */
export type DisplayGradeSystems = { route: RouteGradeSystem; boulder: BoulderGradeSystem };

export const DEFAULT_DISPLAY_SYSTEMS: DisplayGradeSystems = { route: 'ewbank', boulder: 'v_scale' };

export const ROUTE_GRADE_SYSTEMS: readonly { id: RouteGradeSystem; label: string }[] = [
	{ id: 'ewbank', label: 'Ewbank (AU/NZ)' },
	{ id: 'french', label: 'French' },
	{ id: 'yds', label: 'YDS (US)' }
];

export const BOULDER_GRADE_SYSTEMS: readonly { id: BoulderGradeSystem; label: string }[] = [
	{ id: 'v_scale', label: 'V-scale (Hueco)' },
	{ id: 'font', label: 'Fontainebleau (Font)' }
];

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
export function describeDisplaySystems(systems: DisplayGradeSystems): string {
	const route = ROUTE_GRADE_SYSTEMS.find((s) => s.id === systems.route)?.label ?? systems.route;
	const boulder =
		BOULDER_GRADE_SYSTEMS.find((s) => s.id === systems.boulder)?.label ?? systems.boulder;
	return `${route} routes, ${boulder} boulders`;
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
