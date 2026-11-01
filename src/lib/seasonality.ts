export type SeasonalityFilters = {
	month: number;
	q: string;
	view: 'crags' | 'routes';
	crag: string;
	sort: 'season' | 'name';
	page: number;
};

export function readSeasonalityFilters(
	params: URLSearchParams,
	currentMonth: number
): SeasonalityFilters {
	const raw = params.get('month') ?? '';
	const month = /^(?:[1-9]|1[0-2])$/.test(raw) ? Number(raw) : currentMonth;
	const page = Number(params.get('page'));
	return {
		month,
		q: (params.get('q') ?? '').trim().slice(0, 200),
		view: params.get('view') === 'routes' ? 'routes' : 'crags',
		crag: (params.get('crag') ?? '').slice(0, 2000),
		sort: params.get('sort') === 'name' ? 'name' : 'season',
		page: Number.isSafeInteger(page) && page > 0 ? page : 1
	};
}

export function seasonalityHref(
	filters: SeasonalityFilters,
	patch: Partial<SeasonalityFilters> = {}
): string {
	const f = { ...filters, ...patch };
	const p = new URLSearchParams({ month: String(f.month), view: f.view, sort: f.sort });
	if (f.q) p.set('q', f.q);
	if (f.crag) p.set('crag', f.crag);
	if (f.page > 1) p.set('page', String(f.page));
	return `/seasonality?${p}`;
}

export function seasonalityAtMonth(values: number[], month: number) {
	const peak = Math.max(...values);
	return { value: values[month - 1], relative: peak > 0 ? values[month - 1] / peak : null };
}

/** Internal numeric month stays independent of the user's display language. */
export function currentSeasonalityMonth(now: Date, timeZone: string): number {
	try {
		return Number(new Intl.DateTimeFormat('en-GB', { month: 'numeric', timeZone }).format(now));
	} catch {
		return now.getUTCMonth() + 1;
	}
}
