import { describe, expect, it } from 'vitest';
import { roundCoord, weatherDayKey, type WeatherSnapshot } from './weatherKeys';
import {
	buildWeatherConditionsView,
	histogramBinIndex,
	histogramBinLabel,
	type WeatherAscentRow
} from './weatherStats';

function snap(over: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
	return { tempMaxC: 20, tempMinC: 10, precipMm: 0, weatherCode: 0, ...over };
}

function mapOf(entries: [number, number, string, WeatherSnapshot][]) {
	return new Map(
		entries.map(([lat, lon, day, w]) => [weatherDayKey(roundCoord(lat), roundCoord(lon), day), w])
	);
}

const row = (over: Partial<WeatherAscentRow> & { ascentDate: string }): WeatherAscentRow => ({
	lat: -33.6,
	lon: 150.3,
	ascentId: 1,
	routeName: 'Route',
	...over
});

describe('buildWeatherConditionsView', () => {
	it('is null (card hidden) with an empty cache or no matching days', () => {
		expect(buildWeatherConditionsView([row({ ascentDate: '2025-01-01' })], new Map())).toBeNull();
		expect(buildWeatherConditionsView([row({ ascentDate: '2025-01-01' })], undefined)).toBeNull();
		const other = mapOf([[10, 10, '2025-01-01', snap()]]);
		expect(buildWeatherConditionsView([row({ ascentDate: '2025-01-01' })], other)).toBeNull();
	});

	it('counts location-days with and without weather and ignores indoor / coordless rows', () => {
		const map = mapOf([[-33.6, 150.3, '2025-01-01', snap()]]);
		const view = buildWeatherConditionsView(
			[
				row({ ascentDate: '2025-01-01', ascentId: 1 }),
				row({ ascentDate: '2025-01-01', ascentId: 2 }),
				row({ ascentDate: '2025-01-02', ascentId: 3 }),
				row({ ascentDate: '2025-01-01', ascentId: 4, outdoor: false, lat: 1, lon: 1 }),
				row({ ascentDate: '2025-01-03', ascentId: 5, lat: null, lon: null }),
				row({ ascentDate: '2018-00-00', ascentId: 6 })
			],
			map
		)!;
		expect(view.outdoorDays).toBe(2);
		expect(view.withWeather).toBe(1);
		expect(view.withoutWeather).toBe(1);
	});

	it('finds hottest / coldest with the lowest-id ascent link and shares', () => {
		const map = mapOf([
			[-33.6, 150.3, '2025-01-01', snap({ tempMaxC: 38, tempMinC: 24 })],
			[
				-33.6,
				150.3,
				'2025-06-01',
				snap({ tempMaxC: 4, tempMinC: -3, precipMm: 5, weatherCode: 73 })
			],
			[
				-33.6,
				150.3,
				'2025-07-01',
				snap({ tempMaxC: 14, tempMinC: 8, precipMm: 3, weatherCode: 61 })
			]
		]);
		const view = buildWeatherConditionsView(
			[
				row({
					ascentDate: '2025-01-01',
					ascentId: 9,
					routeName: 'Late',
					ascentUrl: null,
					url: 'u9'
				}),
				row({
					ascentDate: '2025-01-01',
					ascentId: 7,
					routeName: 'Hot One',
					ascentUrl: 'https://www.thecrag.com/ascent/7'
				}),
				row({ ascentDate: '2025-06-01', ascentId: 12, routeName: 'Snow Job' }),
				row({ ascentDate: '2025-07-01', ascentId: 20, routeName: 'Wet' })
			],
			map
		)!;
		expect(view.hottest).toEqual({
			tempC: 38,
			routeName: 'Hot One',
			date: '2025-01-01',
			href: 'https://www.thecrag.com/ascent/7'
		});
		expect(view.coldest?.tempC).toBe(-3);
		expect(view.coldest?.routeName).toBe('Snow Job');
		const share = Object.fromEntries(view.shares.map((s) => [s.key, s]));
		expect(share.heat?.days).toBe(1);
		expect(share.freeze?.days).toBe(1);
		expect(share.snow?.days).toBe(1);
		expect(share.rain?.days).toBe(1);
		expect(share.rain?.pct).toBeCloseTo(33.3, 1);
	});

	it('bins daily highs into 5° steps with open ends', () => {
		expect(histogramBinLabel(0)).toBe('<0°');
		expect(histogramBinLabel(1)).toBe('0–4°');
		expect(histogramBinLabel(8)).toBe('35°+');
		expect(histogramBinIndex(-1)).toBe(0);
		expect(histogramBinIndex(0)).toBe(1);
		expect(histogramBinIndex(4.9)).toBe(1);
		expect(histogramBinIndex(5)).toBe(2);
		expect(histogramBinIndex(34.9)).toBe(7);
		expect(histogramBinIndex(35)).toBe(8);
		expect(histogramBinIndex(50)).toBe(8);

		const map = mapOf([
			[-33.6, 150.3, '2025-01-01', snap({ tempMaxC: 22 })],
			[-33.6, 150.3, '2025-01-02', snap({ tempMaxC: 21 })],
			[-33.6, 150.3, '2025-01-03', snap({ tempMaxC: 40 })]
		]);
		const view = buildWeatherConditionsView(
			[
				row({ ascentDate: '2025-01-01' }),
				row({ ascentDate: '2025-01-02' }),
				row({ ascentDate: '2025-01-03' })
			],
			map
		)!;
		expect(view.histogram.find((b) => b.label === '20–24°')?.days).toBe(2);
		expect(view.histogram.find((b) => b.label === '35°+')?.days).toBe(1);
		expect(view.histogram.reduce((n, b) => n + b.days, 0)).toBe(3);
	});
});
