import { describe, expect, it } from 'vitest';
import {
	buildRockPerformanceView,
	ROCK_PERFORMANCE_MAX_BANDS,
	ROCK_PERFORMANCE_MIN_DAYS,
	rockTypeName,
	strongestRockSignal,
	type RockPerformanceRow
} from './rockPerformance';

function tags(rock: string): string {
	return JSON.stringify([{ category: 'Rock type', name: rock }]);
}

function day(n: number): string {
	return new Date(Date.UTC(2025, 0, 1 + n)).toISOString().slice(0, 10);
}

const row = (
	over: Partial<RockPerformanceRow> & { ascentDate: string; tagsJson?: string | null }
): RockPerformanceRow => ({
	isSend: true,
	isAttempt: false,
	tickType: 'Red point',
	gearStyle: 'Sport',
	gradeSystem: 'ewbank',
	gradeScore: 20,
	tagsJson: tags('Granite'),
	...over
});

describe('rockTypeName', () => {
	it('reads Rock type case-insensitively and ignores other categories', () => {
		expect(rockTypeName(tags('Sandstone'))).toBe('Sandstone');
		expect(rockTypeName(JSON.stringify([{ category: 'rock type', name: '  Limestone  ' }]))).toBe(
			'Limestone'
		);
		expect(rockTypeName(JSON.stringify([{ category: 'Style', name: 'Steep' }]))).toBeNull();
		expect(rockTypeName(null)).toBeNull();
	});
});

describe('buildRockPerformanceView', () => {
	it('is null without tagged sends or attempts', () => {
		expect(buildRockPerformanceView([])).toBeNull();
		expect(buildRockPerformanceView([row({ ascentDate: day(0), tagsJson: null })])).toBeNull();
		expect(
			buildRockPerformanceView([
				row({ ascentDate: day(0), isSend: false, isAttempt: false, tickType: 'Hit' })
			])
		).toBeNull();
	});

	it('waits for enough tagged days before showing bands and reports coverage', () => {
		const rows = Array.from({ length: 5 }, (_, i) =>
			row({ ascentDate: day(i), tagsJson: tags('Granite') })
		);
		rows.push(row({ ascentDate: day(0), tagsJson: null }));
		const view = buildRockPerformanceView(rows)!;
		expect(view.ready).toBe(false);
		expect(view.bands).toEqual([]);
		expect(view.ascents).toBe(5);
		expect(view.allAscents).toBe(6);
		expect(view.days).toBe(5);
		expect(view.minDays).toBe(ROCK_PERFORMANCE_MIN_DAYS);
	});

	it('compares send rates by rock with logbook drill-down hrefs', () => {
		const rows: RockPerformanceRow[] = [];
		// Same pattern as weather performance e2e: one rock struggles, the other sends well,
		// with within-band day variation so the cluster-robust SE is non-zero.
		for (let i = 0; i < 24; i++) {
			const granite = i % 2 === 0;
			const rock = granite ? 'Granite' : 'Sandstone';
			const sends = granite ? (i % 4 === 0 ? 1 : 0) : i % 4 === 1 ? 4 : 3;
			for (let n = 0; n < 4; n++) {
				const send = n < sends;
				rows.push(
					row({
						ascentDate: day(i),
						tagsJson: tags(rock),
						isSend: send,
						isAttempt: !send,
						tickType: send ? 'Red point' : 'Attempt'
					})
				);
			}
		}
		const view = buildRockPerformanceView(rows)!;
		expect(view.ready).toBe(true);
		expect(view.rockCount).toBe(2);
		const granite = view.bands.find((b) => b.id === 'rock:granite')!;
		const sand = view.bands.find((b) => b.id === 'rock:sandstone')!;
		expect(granite.href).toBe('/logbook?rock=Granite');
		expect(sand.href).toBe('/logbook?rock=Sandstone');
		expect(granite.sendRate.pct).toBeLessThan(sand.sendRate.pct!);
		expect(granite.sendRate.signal).toBe('lower');
		expect(sand.sendRate.signal).toBe('higher');
		const standout = strongestRockSignal(view.bands, 'sendRate');
		expect(standout?.id === 'rock:granite' || standout?.id === 'rock:sandstone').toBe(true);
	});

	it('folds surplus rock names into Other without a logbook link', () => {
		const rows: RockPerformanceRow[] = [];
		for (let i = 0; i < ROCK_PERFORMANCE_MIN_DAYS; i++) {
			for (let r = 0; r < ROCK_PERFORMANCE_MAX_BANDS + 2; r++) {
				rows.push(
					row({
						ascentDate: day(i),
						tagsJson: tags(`Rock${String(r).padStart(2, '0')}`),
						// More ascents on lower indices so they stay in the head bands.
						gradeScore: 18 + (r === 0 ? 2 : 0)
					})
				);
			}
		}
		// Extra volume on Rock00–Rock10 so Rock11+ become Other.
		for (let i = 0; i < ROCK_PERFORMANCE_MIN_DAYS; i++) {
			for (let r = 0; r < ROCK_PERFORMANCE_MAX_BANDS - 1; r++) {
				rows.push(
					row({
						ascentDate: day(i),
						tagsJson: tags(`Rock${String(r).padStart(2, '0')}`)
					})
				);
			}
		}
		const view = buildRockPerformanceView(rows)!;
		expect(view.rockCount).toBe(ROCK_PERFORMANCE_MAX_BANDS + 2);
		expect(view.bands).toHaveLength(ROCK_PERFORMANCE_MAX_BANDS);
		const other = view.bands.find((b) => b.id === 'aggregate:other')!;
		expect(other.label).toBe('Other');
		expect(other.href).toBeNull();
		expect(other.ascents).toBeGreaterThan(0);
	});

	it('keeps a real Other rock tag distinct from the surplus aggregate', () => {
		const rows: RockPerformanceRow[] = [];
		for (let i = 0; i < ROCK_PERFORMANCE_MIN_DAYS; i++) {
			rows.push(row({ ascentDate: day(i), tagsJson: tags('Other') }));
			rows.push(row({ ascentDate: day(i), tagsJson: tags('Other') }));
			for (let r = 0; r < ROCK_PERFORMANCE_MAX_BANDS; r++) {
				rows.push(row({ ascentDate: day(i), tagsJson: tags(`Rock${r}`) }));
			}
		}
		const bands = buildRockPerformanceView(rows)!.bands;
		expect(bands.find((b) => b.id === 'rock:other')?.href).toBe('/logbook?rock=Other');
		expect(bands.find((b) => b.id === 'aggregate:other')?.href).toBeNull();
		expect(new Set(bands.map((b) => b.id)).size).toBe(bands.length);
	});
});
