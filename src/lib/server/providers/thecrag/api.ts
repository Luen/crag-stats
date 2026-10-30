import { detectAndParseGrade, parseHeightMeters } from '#lib/grades';
import { resolveTheCragAvatar } from '#lib/thecragAvatar';
import { theCragAreaUrl, theCragAscentUrl, theCragRouteUrl } from '#lib/thecragUrls';
import {
	classifyTick,
	type CanonicalAscent,
	type ProviderBatch,
	type ProviderProfile,
	type SyncCursor
} from '../types';
import { resolveEffectiveGrade, type ApiPitch } from './effectiveGrade';

const BASE = 'https://www.thecrag.com/api/logbook/ascents';

type ApiTick = { label?: string; name?: string };
type ApiAreaNode = {
	id?: number | string;
	name?: string;
	urlAncestorStub?: string;
	urlStub?: string;
	geometry?: unknown;
	lat?: number | string | null;
	lon?: number | string | null;
	long?: number | string | null;
	longitude?: number | string | null;
	latitude?: number | string | null;
};
type ApiTagLeaf = { id?: number | string; name?: string };
/** route.tags: { Aspect: { NE: { name, id, ... } }, ... } */
type ApiRouteTags = Record<string, Record<string, ApiTagLeaf>>;
type ApiRoute = {
	id?: number | string;
	name?: string;
	grade?: string;
	gradeBand?: number;
	style?: string;
	height?: { value?: number; unit?: string } | string | number | [number, string];
	displayHeight?: string | [number, string];
	stars?: number;
	bolts?: number | string;
	tags?: ApiRouteTags;
	urlAncestorStub?: string;
	lat?: number | string | null;
	lon?: number | string | null;
	long?: number | string | null;
	longitude?: number | string | null;
	latitude?: number | string | null;
	geometry?: unknown;
	ancestors?: {
		parent?: ApiAreaNode;
		country?: ApiAreaNode & { name?: string };
		TLC?: ApiAreaNode;
		[key: string]: ApiAreaNode | undefined;
	};
};
type ApiAscent = {
	id?: number | string;
	epoch?: number;
	date?: string;
	logDate?: string;
	climbedGearStyle?: string;
	grade?: string;
	gradeSystem?: string;
	gradeBand?: number;
	label?: string;
	/** Climbing partners, often "@login" */
	with?: string | string[] | null;
	quality?: string | null;
	qualityLabel?: string | null;
	numberAttempts?: number | null;
	historical?: boolean | number | null;
	tick?: ApiTick;
	/** Public ascent comment */
	markdown?: string | null;
	/** Owner-only ascent comment (needs the supporter API key) */
	privateMarkdown?: string | null;
	pitch?: ApiPitch[];
	tags?: unknown;
	cpr?: {
		base?: {
			grade?: string;
			band?: number;
			score?: number;
			rating?: number;
			internalGrade?: number;
		};
		shifted?: { grade?: string; band?: number; score?: number; rating?: number };
		decayed?: { grade?: string; band?: number; score?: number; rating?: number };
	};
	route?: ApiRoute;
};
type ApiResponse = {
	data?: {
		account?: {
			id?: number | string;
			name?: string;
			login?: string;
			country?: string;
			ascentCount?: number;
			avatar?: string;
			typeOfClimber?: string;
			outdoorAscentCount?: number;
			indoorAscentCount?: number;
			heightClimbed?: number | string | [number, string];
			routesTicked?: number;
		};
		ascents?: ApiAscent[];
		numberAscents?: number;
		page?: string | number;
		perPage?: number;
	};
};

/**
 * theCrag keeps public (`markdown`) and private (`privateMarkdown`) comments apart.
 * Both land in ascents.comment, which stays owner-only (see notes.ts).
 */
export function ascentNotes(a: Pick<ApiAscent, 'markdown' | 'privateMarkdown'>): string | null {
	const parts = [a.markdown, a.privateMarkdown].map((s) => s?.trim()).filter(Boolean);
	return parts.length ? parts.join('\n\n') : null;
}

/** Flatten theCrag route.tags nested map into chip-friendly pairs. */
export function flattenRouteTags(
	tags: ApiRouteTags | null | undefined
): { category: string; name: string }[] {
	if (!tags || typeof tags !== 'object') return [];
	const out: { category: string; name: string }[] = [];
	for (const [category, leaves] of Object.entries(tags)) {
		if (!leaves || typeof leaves !== 'object') continue;
		for (const leaf of Object.values(leaves)) {
			const name = leaf?.name?.trim();
			if (name) out.push({ category, name });
		}
	}
	return out;
}

function partnersFromWith(value: ApiAscent['with']): string | null {
	if (value == null) return null;
	if (Array.isArray(value)) {
		const joined = value
			.map(String)
			.map((s) => s.trim())
			.filter(Boolean)
			.join(', ');
		return joined || null;
	}
	const s = String(value).trim();
	return s || null;
}

function heightFromUnknown(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') return parseHeightMeters(value);
	if (Array.isArray(value) && value.length >= 1) {
		const n = Number(value[0]);
		if (!Number.isFinite(n)) return null;
		const unit = String(value[1] ?? 'm').toLowerCase();
		return unit.startsWith('ft') ? n * 0.3048 : n;
	}
	if (typeof value === 'object') {
		const obj = value as { value?: number; unit?: string };
		if (obj.value != null) {
			const unit = (obj.unit ?? 'm').toLowerCase();
			return unit.startsWith('ft') ? obj.value * 0.3048 : obj.value;
		}
	}
	return null;
}

function heightFromRoute(route?: ApiRoute): number | null {
	if (!route) return null;
	return heightFromUnknown(route.height) ?? heightFromUnknown(route.displayHeight);
}

function finiteCoord(value: unknown): number | null {
	if (value == null) return null;
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}

/** Pull lat/lon from common theCrag geo shapes (Point geometry, lat/long fields). */
export function extractLatLon(source: unknown): { lat: number; lon: number } | null {
	if (!source || typeof source !== 'object') return null;
	const obj = source as Record<string, unknown>;

	const lat =
		finiteCoord(obj.lat) ??
		finiteCoord(obj.latitude) ??
		finiteCoord(obj.Lat) ??
		finiteCoord(obj.Latitude);
	const lon =
		finiteCoord(obj.lon) ??
		finiteCoord(obj.long) ??
		finiteCoord(obj.longitude) ??
		finiteCoord(obj.Lng) ??
		finiteCoord(obj.Lon) ??
		finiteCoord(obj.Longitude);

	if (lat != null && lon != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
		return { lat, lon };
	}

	const geometry = obj.geometry;
	// theCrag often sends TLC/parent geo as a bare [lon, lat] array (not a GeoJSON object).
	if (Array.isArray(geometry) && geometry.length >= 2) {
		const glon = finiteCoord(geometry[0]);
		const glat = finiteCoord(geometry[1]);
		if (glat != null && glon != null && Math.abs(glat) <= 90 && Math.abs(glon) <= 180) {
			return { lat: glat, lon: glon };
		}
	}
	if (geometry && typeof geometry === 'object') {
		const g = geometry as { type?: string; coordinates?: unknown };
		const coords = g.coordinates;
		if (Array.isArray(coords) && coords.length >= 2) {
			// GeoJSON Point: [lon, lat]
			const glon = finiteCoord(coords[0]);
			const glat = finiteCoord(coords[1]);
			if (glat != null && glon != null && Math.abs(glat) <= 90 && Math.abs(glon) <= 180) {
				return { lat: glat, lon: glon };
			}
		}
	}

	return null;
}

/** Prefer route coords, then TLC / parent / any ancestor node with geometry. */
export function resolveRouteCoords(route?: ApiRoute | null): { lat: number; lon: number } | null {
	if (!route) return null;
	const fromRoute = extractLatLon(route);
	if (fromRoute) return fromRoute;

	const ancestors = route.ancestors;
	if (!ancestors || typeof ancestors !== 'object') return null;

	const preferred = [ancestors.TLC, ancestors.parent, ancestors.country];
	for (const node of preferred) {
		const hit = extractLatLon(node);
		if (hit) return hit;
	}

	for (const node of Object.values(ancestors)) {
		const hit = extractLatLon(node);
		if (hit) return hit;
	}

	return null;
}

function cprNumeric(block?: { score?: number; rating?: number } | null): number | null {
	if (!block) return null;
	const n = block.rating ?? block.score;
	return n != null && Number.isFinite(n) ? n : null;
}

export function mapAscent(a: ApiAscent): CanonicalAscent | null {
	const route = a.route;
	if (!a.id || !route?.id || !route.name) return null;

	const tickName = a.tick?.name || a.tick?.label || '';
	const { isSend, isAttempt } = classifyTick(tickName);
	const gradeRaw = route.grade ?? a.cpr?.base?.grade ?? null;
	// Pass ascent gradeSystem so AU boulder "9" maps via Ewbank→V (VB), not fake V9 (#112).
	const routeParsed = detectAndParseGrade(gradeRaw, {
		gearStyle: route.style ?? a.climbedGearStyle,
		gradeBand: route.gradeBand ?? a.cpr?.base?.band,
		gradeSystem: a.gradeSystem ?? null
	});

	const routeHeightM = heightFromRoute(route);
	const effective = resolveEffectiveGrade({
		routeGrade: route.grade ?? null,
		routeGradeBand: route.gradeBand ?? null,
		routeStyle: route.style ?? null,
		climbedGearStyle: a.climbedGearStyle ?? null,
		ascentGrade: a.grade ?? null,
		ascentGradeSystem: a.gradeSystem ?? null,
		ascentGradeBand: a.gradeBand ?? null,
		cprGrade: a.cpr?.base?.grade ?? null,
		cprBand: a.cpr?.base?.band ?? null,
		pitches: a.pitch ?? null,
		routeHeightM
	});

	const tlc = route.ancestors?.TLC;
	const parent = route.ancestors?.parent;
	const country = route.ancestors?.country?.name;
	const areaId = tlc?.id ?? parent?.id ?? null;
	const areaStub = tlc?.urlAncestorStub ?? parent?.urlAncestorStub ?? route.urlAncestorStub ?? null;
	const tags = flattenRouteTags(route.tags);
	const boltsRaw = route.bolts;
	const bolts =
		typeof boltsRaw === 'number'
			? boltsRaw
			: typeof boltsRaw === 'string' && boltsRaw.trim()
				? Number(boltsRaw)
				: null;
	const coords = resolveRouteCoords(route);
	const attempts =
		a.numberAttempts != null && Number.isFinite(Number(a.numberAttempts))
			? Number(a.numberAttempts)
			: null;

	return {
		provider: 'thecrag',
		externalId: String(a.id),
		route: {
			provider: 'thecrag',
			externalId: String(route.id),
			name: route.name,
			gradeRaw,
			gradeScore: routeParsed.score,
			gradeBand: routeParsed.band?.id ?? route.gradeBand ?? null,
			gradeSystem: routeParsed.system,
			gearStyle: route.style ?? null,
			heightM: routeHeightM,
			stars: route.stars ?? null,
			url: theCragRouteUrl(route.id, route.urlAncestorStub),
			country: country ?? null,
			cragName: tlc?.name ?? parent?.name ?? null,
			cragPath: [country, tlc?.name, parent?.name].filter(Boolean).join(' - ') || null,
			cragUrl: theCragAreaUrl(areaId, areaStub),
			areaExternalId: areaId != null ? String(areaId) : null,
			tags: tags.length ? tags : null,
			bolts: bolts != null && Number.isFinite(bolts) ? bolts : null,
			parentName: parent?.name ?? null,
			parentExternalId: parent?.id != null ? String(parent.id) : null,
			lat: coords?.lat ?? null,
			lon: coords?.lon ?? null
		},
		ascentDate: a.date ?? null,
		logDate: a.logDate ?? null,
		tickType: tickName || null,
		tickLabel: a.tick?.label ?? null,
		ascentGearStyle: a.climbedGearStyle ?? null,
		ascentGradeRaw: a.cpr?.base?.grade ?? effective.raw,
		effectiveGradeRaw: effective.raw,
		effectiveGradeScore: effective.score,
		effectiveGradeBand: effective.band,
		pitchLabel: effective.pitchLabel,
		ascentLabel: a.label?.trim() || null,
		pitchesClimbed: effective.pitchesClimbed,
		pitchesTotal: effective.pitchesTotal,
		heightM: effective.heightM ?? routeHeightM,
		quality: a.quality?.trim() || a.qualityLabel?.trim() || null,
		partners: partnersFromWith(a.with),
		comment: ascentNotes(a),
		isSend,
		isAttempt,
		epoch: a.epoch ?? null,
		numberAttempts: attempts,
		cprBase: a.cpr?.base?.grade ?? null,
		cprScore: cprNumeric(a.cpr?.base),
		cprShiftedScore: cprNumeric(a.cpr?.shifted),
		cprShiftedGrade: a.cpr?.shifted?.grade ?? null,
		cprDecayedScore: cprNumeric(a.cpr?.decayed),
		cprDecayedGrade: a.cpr?.decayed?.grade ?? null,
		/** Public logbook entry for this ascent */
		ascentUrl: theCragAscentUrl(a.id),
		rawJson: JSON.stringify(a)
	};
}

export async function fetchTheCragPage(
	apiKey: string,
	cursor: SyncCursor = {}
): Promise<ProviderBatch> {
	const page = cursor.page ?? 1;
	const url = new URL(BASE);
	url.searchParams.set('page', String(page));
	if (cursor.since) url.searchParams.set('since', cursor.since);

	const res = await fetch(url, {
		headers: {
			Accept: 'application/json',
			'X-CData-Key': `key=${apiKey}`
		}
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`theCrag API ${res.status}: ${body.slice(0, 200) || res.statusText}`);
	}

	const json = (await res.json()) as ApiResponse;
	const data = json.data;
	const ascents = (data?.ascents ?? [])
		.map(mapAscent)
		.filter((a): a is CanonicalAscent => a != null);
	const perPage = data?.perPage ?? 250;
	const total = data?.numberAscents ?? ascents.length;
	const done = page * perPage >= total || ascents.length === 0;

	let profile: ProviderProfile | null = null;
	if (data?.account) {
		const heightClimbed = heightFromUnknown(data.account.heightClimbed);
		profile = {
			provider: 'thecrag',
			externalId: data.account.id != null ? String(data.account.id) : null,
			name: data.account.name ?? null,
			login: data.account.login ?? null,
			country: data.account.country ?? null,
			ascentCount: data.account.ascentCount ?? null,
			avatar: resolveTheCragAvatar(data.account.avatar),
			typeOfClimber: data.account.typeOfClimber ?? null,
			outdoorAscentCount: data.account.outdoorAscentCount ?? null,
			indoorAscentCount: data.account.indoorAscentCount ?? null,
			heightClimbed,
			routesTicked: data.account.routesTicked ?? null,
			rawJson: JSON.stringify(data.account)
		};
	}

	return {
		profile,
		ascents,
		nextCursor: done ? null : { since: cursor.since, page: page + 1 },
		done
	};
}

export async function syncTheCragAll(
	apiKey: string,
	cursor: SyncCursor,
	onPage?: (batch: ProviderBatch) => Promise<void> | void
): Promise<{ maxEpoch: number | null; count: number; profile: ProviderProfile | null }> {
	let pageCursor: SyncCursor = { since: cursor.since ?? null, page: 1 };
	let maxEpoch: number | null = cursor.since ? Number(cursor.since) : null;
	let count = 0;
	let profile: ProviderProfile | null = null;

	for (;;) {
		const batch = await fetchTheCragPage(apiKey, pageCursor);
		if (batch.profile) profile = batch.profile;
		for (const a of batch.ascents) {
			if (a.epoch != null) maxEpoch = Math.max(maxEpoch ?? 0, a.epoch);
		}
		count += batch.ascents.length;
		if (onPage) await onPage(batch);
		if (batch.done || !batch.nextCursor) break;
		pageCursor = batch.nextCursor;
	}

	return { maxEpoch, count, profile };
}
