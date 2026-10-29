/**
 * Pure helpers for theCrag route-history JSON (`/api/route/…?show=info`).
 * Keep network/impersonation out of this module so unit tests stay offline.
 */
import type { FirstAscentKind } from '#lib/server/firstAscents';

export type RouteHistoryEntry = {
	id: string;
	type: string;
	climbers: string | null;
	date: string | null;
	/** Original history object from the route API (full JSON), for future fields (#197). */
	rawJson?: string;
};

function normalizeHistoryType(type: unknown): string {
	return String(type ?? '')
		.trim()
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ');
}

/** Map upstream history type labels to local FA / FFA marks. */
export function historyTypeToKind(type: unknown): FirstAscentKind | null {
	const t = normalizeHistoryType(type);
	if (t === 'first free ascent' || t === 'ffa') return 'FFA';
	if (t === 'first ascent' || t === 'fa') return 'FA';
	return null;
}

/** True for theCrag route-history types that credit bolting / setting (not FA/FFA). */
export function historyTypeIsSetter(type: unknown): boolean {
	const t = normalizeHistoryType(type);
	return t === 'route setter' || t === 'rs';
}

/**
 * True when `climbers` names the owner via an `@login` mention (theCrag API style).
 * Free-text names without @ are not matched — too ambiguous.
 */
export function climbersMentionLogin(climbers: unknown, login: string | null | undefined): boolean {
	const needle = String(login ?? '')
		.trim()
		.replace(/^@/, '')
		.toLowerCase();
	if (!needle) return false;
	const raw = String(climbers ?? '');
	if (!raw) return false;
	// Split on commas / " & " / " and " the way route history is written.
	const parts = raw.split(/,|\s+&\s+|\s+and\s+/i);
	for (const part of parts) {
		const token = part.trim();
		const m = token.match(/^@([A-Za-z0-9._-]+)/);
		if (m && m[1].toLowerCase() === needle) return true;
	}
	return false;
}

/** Prefer FFA over FA when both mention the owner on the same route. */
export function ownerKindsFromHistory(
	entries: readonly RouteHistoryEntry[],
	login: string | null | undefined
): FirstAscentKind | null {
	let fa = false;
	let ffa = false;
	for (const e of entries) {
		if (!climbersMentionLogin(e.climbers, login)) continue;
		const kind = historyTypeToKind(e.type);
		if (kind === 'FFA') ffa = true;
		else if (kind === 'FA') fa = true;
	}
	if (ffa) return 'FFA';
	if (fa) return 'FA';
	return null;
}

/** True when any setter-type row names the owner via `@login`. */
export function ownerIsRouteSetter(
	entries: readonly RouteHistoryEntry[],
	login: string | null | undefined
): boolean {
	for (const e of entries) {
		if (!historyTypeIsSetter(e.type)) continue;
		if (climbersMentionLogin(e.climbers, login)) return true;
	}
	return false;
}

export function normalizeHistoryEntries(raw: unknown): RouteHistoryEntry[] {
	if (!Array.isArray(raw)) return [];
	const out: RouteHistoryEntry[] = [];
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const o = item as Record<string, unknown>;
		const id = o.id != null ? String(o.id) : '';
		const type = o.type != null ? String(o.type) : '';
		if (!id || !type) continue;
		let rawJson: string;
		try {
			rawJson = JSON.stringify(o);
		} catch {
			rawJson = JSON.stringify({ id, type, climbers: o.climbers ?? null, date: o.date ?? null });
		}
		out.push({
			id,
			type,
			climbers: o.climbers != null ? String(o.climbers) : null,
			date: o.date != null ? String(o.date) : null,
			rawJson
		});
	}
	return out;
}
