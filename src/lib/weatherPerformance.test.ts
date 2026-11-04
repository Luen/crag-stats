import { describe, expect, it } from 'vitest';
import { roundCoord, weatherDayKey, type WeatherSnapshot } from './weatherKeys';
import {
	buildWeatherPerformanceView,
	compareRates,
	isDryWeather,
	MIN_RATE_ASCENTS,
	ratioStats,
	strongestSignal,
	WEATHER_PERFORMANCE_MIN_DAYS,
	type WeatherPerformanceBand,
	type WeatherPerformanceRow,
	type WeatherPerformanceView
} from './weatherPerformance';

const LAT = -33.6;
const LON = 150.3;

function snap(over: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
	return { tempMaxC: 20, tempMinC: 10, precipMm: 0, weatherCode: 0, windMaxKmh: 10, ...over };
}

function keyOf(day: string, lat = LAT, lon = LON) {
	return weatherDayKey(roundCoord(lat), roundCoord(lon), day);
}

function day(n: number): string {
	return new Date(Date.UTC(2025, 0, 1 + n)).toISOString().slice(0, 10);
}

const row = (
	over: Partial<WeatherPerformanceRow> & { ascentDate: string }
): WeatherPerformanceRow => ({
	lat: LAT,
	lon: LON,
	isSend: true,
	isAttempt: false,
	tickType: 'Red point',
	gearStyle: 'Sport',
	gradeSystem: 'ewbank',
	gradeScore: 20,
	...over
});

/** `sends` sends then `ascents - sends` attempts on one day. */
function dayRows(
	d: string,
	ascents: number,
	sends: number,
	over: Omit<Partial<WeatherPerformanceRow>, 'ascentDate'> = {}
) {
	return Array.from({ length: ascents }, (_, i) =>
		row({
			ascentDate: d,
			isSend: i < sends,
			isAttempt: i >= sends,
			tickType: i < sends ? 'Red point' : 'Attempt',
			...over
		})
	);
}

function band(view: WeatherPerformanceView, id: string): WeatherPerformanceBand {
	const found = view.groups.flatMap((g) => g.bands).find((b) => b.id === id);
	if (!found) throw new Error(`no band ${id}`);
	return found;
}

describe('buildWeatherPerformanceView', () => {
	it('is null without cached weather, for indoor rows, and for unresolved locations', () => {
		const rows = [row({ ascentDate: day(1) })];
		expect(buildWeatherPerformanceView(rows, new Map())).toBeNull();
		expect(buildWeatherPerformanceView(rows, undefined)).toBeNull();
		const map = new Map([[keyOf(day(1)), snap()]]);
		expect(
			buildWeatherPerformanceView([row({ ascentDate: day(1), outdoor: false })], map)
		).toBeNull();
		expect(
			buildWeatherPerformanceView([row({ ascentDate: day(1), weatherLocation: null })], map)
		).toBeNull();
		// Ticks that are neither a send nor an attempt are not ascents for these rates.
		expect(
			buildWeatherPerformanceView(
				[row({ ascentDate: day(1), isSend: false, isAttempt: false, tickType: 'Hit' })],
				map
			)
		).toBeNull();
	});

	it('reports coverage and waits for enough location-days before showing bands', () => {
		const rows = [
			...dayRows(day(1), 3, 2),
			row({ ascentDate: day(2) }), // outdoor, no cached day
			row({ ascentDate: day(1), outdoor: false }),
			row({ ascentDate: '2025-02-30' }),
			row({
				ascentDate: day(1),
				lat: 10,
				lon: 10,
				weatherLocation: {
					lat: 10,
					lon: 10,
					source: 'place',
					name: 'Town',
					areaId: null,
					precision: 'town',
					resolvedAt: '2025-01-01'
				}
			})
		];
		const map = new Map([
			[keyOf(day(1)), snap()],
			[keyOf(day(1), 10, 10), snap()]
		]);
		const view = buildWeatherPerformanceView(rows, map)!;
		expect(view.ready).toBe(false);
		expect(view.groups).toEqual([]);
		expect(view.outdoorAscents).toBe(5);
		expect(view.ascents).toBe(4);
		expect(view.approximateAscents).toBe(1);
		expect(view.days).toBe(2);
		expect(view.minDays).toBe(WEATHER_PERFORMANCE_MIN_DAYS);
		expect(view.overall.sendRate).toBe(75);
	});

	it('assigns daily highs to half-open temperature bands and skips unknown highs', () => {
		const highs = [9.9, 10, 17.99, 18, 24.9, 25, 29.99, 30, null];
		const rows: WeatherPerformanceRow[] = [];
		const map = new Map<string, WeatherSnapshot>();
		for (let i = 0; i < WEATHER_PERFORMANCE_MIN_DAYS; i++) {
			const d = day(i);
			rows.push(row({ ascentDate: d }));
			map.set(keyOf(d), snap({ tempMaxC: i < highs.length ? highs[i] : 20 }));
		}
		const view = buildWeatherPerformanceView(rows, map)!;
		expect(view.ready).toBe(true);
		const temp = view.groups.find((g) => g.key === 'temperature')!;
		expect(temp.overlapping).toBe(false);
		expect(temp.bands.map((b) => [b.label, b.days])).toEqual([
			['Under 10°', 1],
			['10–17°', 2],
			['18–24°', 2 + (WEATHER_PERFORMANCE_MIN_DAYS - highs.length)],
			['25–29°', 2],
			['30°+', 1]
		]);
		expect(temp.bands.map((b) => b.href)).toEqual([
			'/logbook?weatherHighMax=10',
			'/logbook?weatherHighMin=10&weatherHighMax=18',
			'/logbook?weatherHighMin=18&weatherHighMax=25',
			'/logbook?weatherHighMin=25&weatherHighMax=30',
			'/logbook?weatherHighMin=30'
		]);
		// Null high is in no temperature band but still in the overall total.
		expect(temp.bands.reduce((s, b) => s + b.days, 0)).toBe(view.days - 1);
	});

	it('flags a band that differs from other days and stays quiet on noise', () => {
		const rows: WeatherPerformanceRow[] = [];
		const map = new Map<string, WeatherSnapshot>();
		for (let i = 0; i < 24; i++) {
			const d = day(i);
			const cold = i % 2 === 0;
			map.set(keyOf(d), snap({ tempMaxC: cold ? 5 : 20 }));
			// Cold days: 0–1 of 4 sent. Mild days: 3–4 of 4 sent.
			rows.push(...dayRows(d, 4, cold ? (i % 4 === 0 ? 1 : 0) : i % 4 === 1 ? 4 : 3));
		}
		const view = buildWeatherPerformanceView(rows, map)!;
		const cold = band(view, 'temp:lt');
		const mild = band(view, 'temp:18');
		expect(cold.sendRate.pct).toBe(12.5);
		expect(mild.sendRate.pct).toBe(87.5);
		expect(cold.sendRate.diffPts).toBe(-75);
		expect(cold.sendRate.signal).toBe('lower');
		expect(mild.sendRate.signal).toBe('higher');
		expect(mild.sendRate.z).toBeGreaterThan(1.96);
		const temp = view.groups.find((g) => g.key === 'temperature')!;
		expect([cold.id, mild.id]).toContain(strongestSignal(temp, 'sendRate')?.id);
		// Empty bands never show a rate.
		expect(band(view, 'temp:gte').sendRate).toMatchObject({ pct: null, signal: null });

		// Same split pattern on both sides: no band stands out.
		const noisy: WeatherPerformanceRow[] = [];
		for (let i = 0; i < 24; i++) noisy.push(...dayRows(day(i), 4, i % 3 === 0 ? 1 : 3));
		const flat = buildWeatherPerformanceView(noisy, map)!;
		expect(band(flat, 'temp:lt').sendRate.signal).toBeNull();
		expect(strongestSignal(flat.groups[0]!, 'sendRate')).toBeNull();
	});

	it('hides rates below the minimum sample', () => {
		const rows: WeatherPerformanceRow[] = [];
		const map = new Map<string, WeatherSnapshot>();
		for (let i = 0; i < WEATHER_PERFORMANCE_MIN_DAYS; i++) {
			map.set(keyOf(day(i)), snap({ tempMaxC: i < 3 ? 5 : 20 }));
			rows.push(...dayRows(day(i), i < 3 ? 2 : 4, 1));
		}
		const view = buildWeatherPerformanceView(rows, map)!;
		const cold = band(view, 'temp:lt');
		expect(cold.ascents).toBeLessThan(MIN_RATE_ASCENTS);
		expect(cold.sendRate).toMatchObject({ pct: null, diffPts: null, signal: null, count: 3 });
	});

	it('scores near-limit sends against the same style in the year before, never the same day', () => {
		const map = new Map<string, WeatherSnapshot>();
		for (let i = 0; i < WEATHER_PERFORMANCE_MIN_DAYS + 5; i++) map.set(keyOf(day(400 + i)), snap());
		const rows: WeatherPerformanceRow[] = [
			// Baselines: sport 24 within a year, sport 30 too old, trad 18, gym 32 ignored.
			row({ ascentDate: day(300), gradeScore: 24, lat: 1, lon: 1 }),
			row({ ascentDate: day(0), gradeScore: 30, lat: 1, lon: 1 }),
			row({ ascentDate: day(300), gradeScore: 18, gearStyle: 'Trad', lat: 1, lon: 1 }),
			row({ ascentDate: day(300), gradeScore: 32, outdoor: false }),
			row({ ascentDate: day(300), gradeScore: 6, gearStyle: 'Boulder', gradeSystem: 'v_scale' }),
			// Analysed sends.
			row({ ascentDate: day(400), gradeScore: 22 }), // sport, 24 − 2 → near
			row({ ascentDate: day(401), gradeScore: 21 }), // sport → not near
			row({ ascentDate: day(402), gradeScore: 17, gearStyle: 'Trad' }), // trad 18 − 2 → near
			row({ ascentDate: day(403), gradeScore: 5, gearStyle: 'Boulder', gradeSystem: 'v_scale' }), // V6 − 1 → near
			row({ ascentDate: day(404), gradeScore: 4, gearStyle: 'Boulder', gradeSystem: 'v_scale' }), // not near
			row({ ascentDate: day(405), gradeScore: 20, gearStyle: 'Top rope' }), // no baseline
			row({ ascentDate: day(406), gradeScore: null }), // ungraded
			// Same-day harder send must not set its own baseline.
			row({ ascentDate: day(407), gradeScore: 28, gearStyle: 'Trad' }),
			row({ ascentDate: day(407), gradeScore: 15, gearStyle: 'Trad' })
		];
		for (let i = 408; i < 400 + WEATHER_PERFORMANCE_MIN_DAYS + 5; i++)
			rows.push(row({ ascentDate: day(i), isSend: false, isAttempt: true, tickType: 'Attempt' }));
		const view = buildWeatherPerformanceView(rows, map)!;
		const mild = band(view, 'temp:18');
		// Eligible: 22, 21, 17 trad, V5, V4, 28 trad, 15 trad → near: 22, 17, V5, 28.
		expect(mild.nearLimit.total).toBe(7);
		expect(mild.nearLimit.count).toBe(4);
	});

	it('counts onsights and flashes among sends', () => {
		const map = new Map<string, WeatherSnapshot>();
		const rows: WeatherPerformanceRow[] = [];
		for (let i = 0; i < WEATHER_PERFORMANCE_MIN_DAYS; i++) {
			map.set(keyOf(day(i)), snap());
			rows.push(
				row({ ascentDate: day(i), tickType: i % 2 ? 'Onsight' : 'Flash' }),
				row({ ascentDate: day(i), tickType: 'Red point' }),
				row({ ascentDate: day(i), isSend: false, isAttempt: true, tickType: 'Attempt' })
			);
		}
		const view = buildWeatherPerformanceView(rows, map)!;
		expect(view.overall.onsightFlash).toBe(50);
		expect(band(view, 'cond:fair').onsightFlash).toMatchObject({ count: 20, total: 40 });
	});

	it('builds overlapping condition bands from the shared weather rules', () => {
		const map = new Map<string, WeatherSnapshot>();
		const rows: WeatherPerformanceRow[] = [];
		const kinds: Partial<WeatherSnapshot>[] = [
			{ precipMm: 5 }, // rainy
			{ precipMm: 2, tempMaxC: 0, weatherCode: 73 }, // snowy, freezing low
			{ tempMaxC: 36 }, // hot, dry
			{ precipMm: null }, // unknown precipitation: not dry, not fair
			{ windMaxKmh: 60 } // windy, dry
		];
		for (let i = 0; i < WEATHER_PERFORMANCE_MIN_DAYS; i++) {
			map.set(keyOf(day(i)), snap({ tempMinC: i === 1 ? -3 : 10, ...(kinds[i] ?? {}) }));
			rows.push(row({ ascentDate: day(i) }));
		}
		const view = buildWeatherPerformanceView(rows, map)!;
		const cond = view.groups.find((g) => g.key === 'conditions')!;
		expect(cond.overlapping).toBe(true);
		const daysOf = Object.fromEntries(cond.bands.map((b) => [b.id, b.days]));
		expect(daysOf).toMatchObject({
			'cond:rain': 1,
			'cond:snow': 1,
			'cond:heat': 1,
			'cond:freeze': 1,
			'cond:wind': 1,
			// Default fixture wind is calm; only the ≥50 km/h day is excluded.
			'cond:calm': WEATHER_PERFORMANCE_MIN_DAYS - 1,
			'cond:dry': WEATHER_PERFORMANCE_MIN_DAYS - 3,
			// Windy days can still be fair (dry 20°C); the hot and null-precip days are not.
			'cond:fair': WEATHER_PERFORMANCE_MIN_DAYS - 4
		});
		expect(cond.bands.find((b) => b.id === 'cond:dry')!.href).toBeNull();
		expect(cond.bands.find((b) => b.id === 'cond:rain')!.href).toBe('/logbook?weather=rain');
		expect(cond.bands.find((b) => b.id === 'cond:calm')!.href).toBe('/logbook?weather=calm');
		expect(cond.bands.find((b) => b.id === 'cond:wind')!.href).toBe('/logbook?weather=wind');
	});
});

describe('isDryWeather', () => {
	it('needs measured precipitation below 1 mm and no snow', () => {
		expect(isDryWeather(snap({ precipMm: 0 }))).toBe(true);
		expect(isDryWeather(snap({ precipMm: 0.9 }))).toBe(true);
		expect(isDryWeather(snap({ precipMm: 1 }))).toBe(false);
		expect(isDryWeather(snap({ precipMm: null }))).toBe(false);
		expect(isDryWeather(snap({ precipMm: 0, weatherCode: 71 }))).toBe(false);
	});
});

describe('ratioStats / compareRates', () => {
	it('uses the cluster-robust ratio variance', () => {
		const s = ratioStats([
			{ num: 1, den: 2 },
			{ num: 3, den: 4 },
			{ num: 0, den: 0 }
		]);
		expect(s).toMatchObject({ num: 4, den: 6, days: 2 });
		expect(s.p).toBeCloseTo(4 / 6);
		// Residuals: 1 − 2p = −1/3, 3 − 4p = 1/3 → 2 · (2/9) / 36.
		expect(s.v).toBeCloseTo((2 * (2 / 9)) / 36);
		expect(ratioStats([{ num: 1, den: 3 }]).v).toBeNull();
	});

	it('does not let one busy day manufacture a signal', () => {
		// One 30-for-30 day plus five 0-for-2 days vs ten 1-for-2 days. A naive binomial test
		// sees 30/40 vs 10/20; by day the band is one outlier, so it must not stand out.
		const band = [{ num: 30, den: 30 }, ...Array.from({ length: 5 }, () => ({ num: 0, den: 2 }))];
		const rest = Array.from({ length: 10 }, () => ({ num: 1, den: 2 }));
		const out = compareRates(band, rest);
		expect(out.pct).toBe(75);
		expect(out.diffPts).toBe(25);
		expect(out.signal).toBeNull();
	});
});
