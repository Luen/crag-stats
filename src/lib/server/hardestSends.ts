/**
 * Hardest sends, ranked within each discipline (#58). Route scores are Ewbank and
 * boulder scores V-scale, so one sort across both buried every boulder below Ewbank 12.
 * Routes and boulders each get half the slots; a discipline with fewer sends gives its
 * spare slots to the other. Routes are listed first, each group hardest-first.
 */
export type Discipline = 'route' | 'boulder';

export function pickHardestSends<T>(
	sends: readonly T[],
	scoreOf: (row: T) => number | null,
	disciplineOf: (row: T) => Discipline,
	limit = 10
): { row: T; discipline: Discipline }[] {
	const groups: Record<Discipline, { row: T; score: number }[]> = { route: [], boulder: [] };
	for (const row of sends) {
		const score = scoreOf(row);
		if (score == null || !Number.isFinite(score)) continue;
		groups[disciplineOf(row)].push({ row, score });
	}
	for (const g of Object.values(groups)) g.sort((a, b) => b.score - a.score);

	const half = Math.ceil(limit / 2);
	let routes = Math.min(groups.route.length, half);
	const boulders = Math.min(groups.boulder.length, limit - routes);
	routes = Math.min(groups.route.length, limit - boulders);

	return [
		...groups.route.slice(0, routes).map((g) => ({ row: g.row, discipline: 'route' as const })),
		...groups.boulder
			.slice(0, boulders)
			.map((g) => ({ row: g.row, discipline: 'boulder' as const }))
	];
}
