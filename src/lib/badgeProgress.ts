/**
 * Rank locked countable badges by % complete for the “Almost there” coach (#254).
 * Pure — no DB. Skips holiday / first-event badges with no numeric threshold.
 */

export type BadgeAlmost = {
	id: string;
	title: string;
	current: number;
	target: number;
	/** 0–99 until earned (never 100 — those are earned). */
	pct: number;
};

export type BadgeAlmostCandidate = {
	id: string;
	title: string;
	current: number;
	target: number;
};

/** Build progress rows for locked countable badges; highest % first, capped. */
export function rankAlmostBadges(
	candidates: readonly BadgeAlmostCandidate[],
	opts: { limit?: number } = {}
): BadgeAlmost[] {
	const limit = opts.limit ?? 3;
	const rows: BadgeAlmost[] = [];
	for (const c of candidates) {
		if (!Number.isFinite(c.current) || !Number.isFinite(c.target)) continue;
		if (c.target <= 0 || c.current <= 0) continue;
		if (c.current >= c.target) continue;
		const pct = Math.min(99, Math.round((1000 * c.current) / c.target) / 10);
		rows.push({
			id: c.id,
			title: c.title,
			current: c.current,
			target: c.target,
			pct
		});
	}
	return rows.sort((a, b) => b.pct - a.pct || a.target - b.target).slice(0, limit);
}
