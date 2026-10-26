import { detectAndParseGrade, parseHeightMeters } from '#lib/grades';
import {
	classifyTick,
	type CanonicalAscent,
	type ProviderBatch,
	type ProviderProfile,
	type SyncCursor
} from '../types';

const BASE = 'https://www.thecrag.com/api/logbook/ascents';

type ApiTick = { label?: string; name?: string };
type ApiRoute = {
	id?: number | string;
	name?: string;
	grade?: string;
	gradeBand?: number;
	style?: string;
	height?: { value?: number; unit?: string } | string | number | [number, string];
	displayHeight?: string | [number, string];
	stars?: number;
	urlAncestorStub?: string;
	ancestors?: {
		parent?: { id?: number | string; name?: string };
		country?: { name?: string };
		TLC?: { id?: number | string; name?: string };
	};
};
type ApiAscent = {
	id?: number | string;
	epoch?: number;
	date?: string;
	logDate?: string;
	climbedGearStyle?: string;
	tick?: ApiTick;
	markdown?: string;
	cpr?: { base?: { grade?: string; band?: number; score?: number } };
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
		};
		ascents?: ApiAscent[];
		numberAscents?: number;
		page?: string | number;
		perPage?: number;
	};
};

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

function mapAscent(a: ApiAscent): CanonicalAscent | null {
	const route = a.route;
	if (!a.id || !route?.id || !route.name) return null;

	const tickName = a.tick?.name || a.tick?.label || '';
	const { isSend, isAttempt } = classifyTick(tickName);
	const gradeRaw = route.grade ?? a.cpr?.base?.grade ?? null;
	const parsed = detectAndParseGrade(gradeRaw, {
		gearStyle: route.style ?? a.climbedGearStyle,
		gradeBand: route.gradeBand ?? a.cpr?.base?.band
	});

	const tlc = route.ancestors?.TLC;
	const parent = route.ancestors?.parent;
	const country = route.ancestors?.country?.name;

	return {
		provider: 'thecrag',
		externalId: String(a.id),
		route: {
			provider: 'thecrag',
			externalId: String(route.id),
			name: route.name,
			gradeRaw,
			gradeScore: parsed.score,
			gradeBand: parsed.band?.id ?? route.gradeBand ?? null,
			gradeSystem: parsed.system,
			gearStyle: route.style ?? null,
			heightM: heightFromRoute(route),
			stars: route.stars ?? null,
			url: route.urlAncestorStub
				? `https://www.thecrag.com${route.urlAncestorStub}`
				: `https://www.thecrag.com/route/${route.id}`,
			country: country ?? null,
			cragName: tlc?.name ?? parent?.name ?? null,
			cragPath: [country, tlc?.name, parent?.name].filter(Boolean).join(' - ') || null,
			areaExternalId: tlc?.id != null ? String(tlc.id) : parent?.id != null ? String(parent.id) : null
		},
		ascentDate: a.date ?? null,
		logDate: a.logDate ?? null,
		tickType: tickName || null,
		tickLabel: a.tick?.label ?? null,
		ascentGearStyle: a.climbedGearStyle ?? null,
		ascentGradeRaw: a.cpr?.base?.grade ?? null,
		heightM: heightFromRoute(route),
		quality: null,
		partners: null,
		comment: a.markdown ?? null,
		isSend,
		isAttempt,
		epoch: a.epoch ?? null,
		cprBase: a.cpr?.base?.grade ?? null,
		cprScore: a.cpr?.base?.score ?? null,
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
	const ascents = (data?.ascents ?? []).map(mapAscent).filter((a): a is CanonicalAscent => a != null);
	const perPage = data?.perPage ?? 250;
	const total = data?.numberAscents ?? ascents.length;
	const done = page * perPage >= total || ascents.length === 0;

	let profile: ProviderProfile | null = null;
	if (data?.account) {
		profile = {
			provider: 'thecrag',
			externalId: data.account.id != null ? String(data.account.id) : null,
			name: data.account.name ?? null,
			login: data.account.login ?? null,
			country: data.account.country ?? null,
			ascentCount: data.account.ascentCount ?? null,
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
