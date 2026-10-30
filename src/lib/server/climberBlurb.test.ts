import { describe, expect, it } from 'vitest';
import {
	buildClimberBlurb,
	classifyPutUpStyle,
	describeDeveloperPreference,
	describeHardest,
	describeHomeCrag,
	describePartners,
	describePopularity,
	describeProjects,
	describeSeason,
	describeSendPreference,
	describeSolo,
	describeTravel,
	describeWanderer,
	describeWeatherPersonality,
	seasonNameForMonth
} from './climberBlurb';
import type { WeatherConditionsView } from '#lib/weatherStats';
import type { DeveloperImpactRoute } from './routeDeveloperImpact';

const route = (p: Partial<DeveloperImpactRoute>): DeveloperImpactRoute => ({
	routeExternalId: 'r1',
	routeName: 'Route',
	url: null,
	gearStyle: 'Sport',
	bolts: 8,
	ascentCount: 20,
	ownAscents: 2,
	othersAscents: 18,
	ascentCountFetchedAt: '2026-01-01',
	fromFa: true,
	faKind: 'FA',
	fromSetter: false,
	sportOrBolted: true,
	styleLabel: 'Sport/bolted',
	...p
});

describe('describeSendPreference', () => {
	it('favours onsighting when first-go ticks dominate', () => {
		expect(
			describeSendPreference({
				onsightCount: 40,
				flashCount: 10,
				redpointCount: 20,
				pinkpointCount: 5,
				totalSends: 80
			})
		).toMatch(/onsight/i);
	});

	it('favours working / redpointing when those dominate', () => {
		expect(
			describeSendPreference({
				onsightCount: 5,
				flashCount: 2,
				redpointCount: 50,
				pinkpointCount: 10,
				totalSends: 80
			})
		).toMatch(/work routes|redpoint/i);
	});

	it('falls back to a mixed style when neither side wins clearly', () => {
		expect(
			describeSendPreference({
				onsightCount: 20,
				flashCount: 5,
				redpointCount: 22,
				pinkpointCount: 3,
				totalSends: 60
			})
		).toMatch(/mix/i);
	});
});

describe('describeDeveloperPreference (#186)', () => {
	it('prefers sport over trad over boulder', () => {
		const text = describeDeveloperPreference({
			routes: [
				route({ routeExternalId: 's1', gearStyle: 'Sport', sportOrBolted: true, othersAscents: 5 }),
				route({ routeExternalId: 's2', gearStyle: 'Sport', sportOrBolted: true, othersAscents: 5 }),
				route({
					routeExternalId: 't1',
					gearStyle: 'Trad',
					sportOrBolted: false,
					bolts: null,
					othersAscents: 40
				}),
				route({
					routeExternalId: 't2',
					gearStyle: 'Trad',
					sportOrBolted: false,
					bolts: null,
					othersAscents: 40
				})
			],
			firstAscentCount: 4
		});
		expect(text).toMatch(/bolt sport routes/i);
		expect(text).toMatch(/put up 4 first ascents/i);
		expect(text).not.toMatch(/trad/i);
	});

	it('uses trad wording when sport is weak and adds community impact', () => {
		const text = describeDeveloperPreference({
			routes: [
				route({
					routeExternalId: 't1',
					gearStyle: 'Trad',
					sportOrBolted: false,
					bolts: null,
					othersAscents: 30
				}),
				route({
					routeExternalId: 't2',
					gearStyle: 'Trad',
					sportOrBolted: false,
					bolts: null,
					othersAscents: 25
				})
			],
			firstAscentCount: 2
		});
		expect(text).toBe(
			"I like to put up trad routes that other people have climbed over 55 times. I've put up 2 first ascents."
		);
	});

	it('describes large community totals as hedged ascent counts, not people', () => {
		const text = describeDeveloperPreference({
			routes: [route({ othersAscents: 80 }), route({ routeExternalId: 's2', othersAscents: 40 })]
		});
		expect(text).toMatch(/climbed over 120 times/i);
		expect(text).not.toMatch(/more than|people climbing/i);
	});

	it('falls back to FA-only copy without a style majority', () => {
		expect(
			describeDeveloperPreference({
				routes: [
					route({ gearStyle: 'Alpine', sportOrBolted: false, bolts: null, othersAscents: 2 })
				],
				firstAscentCount: 3
			})
		).toBe("I've put up 3 first ascents.");
	});
});

describe('classifyPutUpStyle', () => {
	it('maps sport/bolted, trad and boulder', () => {
		expect(classifyPutUpStyle('Sport', 8)).toBe('Sport');
		expect(classifyPutUpStyle(null, 4)).toBe('Sport');
		expect(classifyPutUpStyle('Trad', null)).toBe('Trad');
		expect(classifyPutUpStyle('Boulder', null)).toBe('Boulder');
		expect(classifyPutUpStyle('Alpine', null)).toBeNull();
	});

	it('lets explicit gear style win over bolts and the sportOrBolted flag', () => {
		expect(classifyPutUpStyle('Trad', 5)).toBe('Trad');
		expect(classifyPutUpStyle('Top rope', 6)).toBeNull();
		expect(classifyPutUpStyle('Trad', 5, true)).toBe('Trad');
		expect(classifyPutUpStyle('Boulder', 2)).toBe('Boulder');
	});
});

describe('optional personality lines', () => {
	it('describes home crag, partners, projects, hardest, travel', () => {
		expect(
			describeHomeCrag({ topCrags: [{ crag: 'Arapiles', count: 50 }], totalAscents: 100 })
		).toBe('I often climb at Arapiles.');
		expect(describeWanderer(12, 0.1)).toMatch(/hop around/i);
		expect(describePartners([{ name: 'Alex', count: 12 }])).toBe('I climb a lot with Alex.');
		expect(describeProjects(3)).toBe("I'm sitting on 3 open projects.");
		expect(describeHardest('24', 'V6')).toBe('Hardest sends sit around 24 / V6.');
		expect(describeTravel(3)).toBe('Climbed in 3 countries.');
		expect(describeSolo([{ kind: 'free', count: 5 }])).toBe("I've logged 5 free solos.");
		expect(describePopularity({ busyPct: 20, quietPct: 80, withData: 40 })).toMatch(/quiet gems/i);
	});

	it('names seasons from active days with locale hemisphere', () => {
		expect(seasonNameForMonth(9, 'en-AU')).toBe('spring'); // October
		expect(seasonNameForMonth(3, 'en-US')).toBe('spring'); // April
		const days = Array.from({ length: 30 }, (_, i) => `2024-10-${String(i + 1).padStart(2, '0')}`);
		expect(describeSeason(days, 'en-AU')).toMatch(/spring climber/i);
	});
});

describe('buildClimberBlurb', () => {
	it('keeps core paragraphs and caps optional lines', () => {
		const blurb = buildClimberBlurb({
			firstDate: '2010-01-01',
			activeDays: 100,
			totalAscents: 200,
			totalSends: 150,
			onsightCount: 40,
			flashCount: 10,
			redpointCount: 80,
			pinkpointCount: 5,
			climberType: 'Trad climber',
			heightM: 5000,
			distinctRoutes: 80,
			distinctCrags: 12,
			outdoorAscents: 180,
			indoorAscents: 20,
			topCrags: [{ crag: 'Arapiles', count: 120 }],
			partners: [{ name: 'Alex', count: 20 }],
			openProjects: 4,
			hardestRouteLabel: '24',
			hardestBoulderLabel: 'V6',
			countries: 3,
			rockBlurb: 'I climb mostly on Sandstone.',
			putUpRoutes: [
				route({ othersAscents: 40 }),
				route({ routeExternalId: 's2', othersAscents: 40 })
			],
			firstAscentCount: 5,
			soloByKind: [{ kind: 'free', count: 8 }],
			activeDayDates: Array.from(
				{ length: 40 },
				(_, i) => `2024-10-${String((i % 28) + 1).padStart(2, '0')}`
			),
			popularity: { busyPct: 20, quietPct: 80, withData: 50 }
		});
		expect(blurb.paragraphs[0]).toMatch(/Since I began climbing/);
		expect(blurb.paragraphs.some((p) => /bolt sport routes/i.test(p))).toBe(true);
		// Core (~5) + at most 3 optional.
		expect(blurb.paragraphs.length).toBeLessThanOrEqual(8);
		expect(
			blurb.paragraphs.filter((p) =>
				/Alex|Arapiles|spring|solo|project|quiet|countries|Sandstone|Hardest/i.test(p)
			).length
		).toBeLessThanOrEqual(3);
	});

	it('uses the default en-AU (southern) seasons when dateDisplay is omitted', () => {
		const blurb = buildClimberBlurb({
			firstDate: '2010-01-01',
			activeDays: 100,
			totalAscents: 200,
			totalSends: 150,
			onsightCount: 40,
			flashCount: 10,
			redpointCount: 80,
			pinkpointCount: 5,
			climberType: 'Trad climber',
			heightM: 5000,
			distinctRoutes: 80,
			distinctCrags: 2,
			outdoorAscents: 180,
			indoorAscents: 20,
			activeDayDates: Array.from(
				{ length: 30 },
				(_, i) => `2024-10-${String(i + 1).padStart(2, '0')}`
			)
		});
		expect(blurb.paragraphs.some((p) => /spring climber/i.test(p))).toBe(true);
	});
});

describe('describeWeatherPersonality (#275)', () => {
	const view = (over: Partial<WeatherConditionsView> = {}): WeatherConditionsView => ({
		outdoorDays: 40,
		withWeather: 30,
		withoutWeather: 10,
		hottest: { tempC: 28, routeName: 'A', date: '2025-01-01', href: null },
		coldest: { tempC: 8, routeName: 'B', date: '2025-06-01', href: null },
		shares: [
			{ key: 'rain', label: 'Rainy', days: 1, pct: 3.3 },
			{ key: 'snow', label: 'Snowy', days: 0, pct: 0 },
			{ key: 'freeze', label: 'Freezing', days: 0, pct: 0 },
			{ key: 'heat', label: 'Hot', days: 0, pct: 0 }
		],
		histogram: [],
		...over
	});
	const withShare = (key: string, days: number, pct: number) =>
		view().shares.map((s) => (s.key === key ? { ...s, days, pct } : s));

	it('is silent without a view, with too few days, or with thin coverage', () => {
		expect(describeWeatherPersonality(null)).toBeNull();
		expect(describeWeatherPersonality(undefined)).toBeNull();
		expect(describeWeatherPersonality(view({ withWeather: 19, outdoorDays: 19 }))).toBeNull();
		expect(
			describeWeatherPersonality(
				view({ withWeather: 20, outdoorDays: 60, shares: withShare('freeze', 10, 50) })
			)
		).toBeNull();
	});

	it('is silent when nothing stands out', () => {
		expect(describeWeatherPersonality(view())).toBeNull();
	});

	it('names the strongest signal in positive wording', () => {
		expect(describeWeatherPersonality(view({ shares: withShare('snow', 4, 13.3) }))).toBe(
			"I've climbed in the snow on 4 days."
		);
		expect(describeWeatherPersonality(view({ shares: withShare('freeze', 9, 30) }))).toContain(
			'happy climbing in the cold: 30%'
		);
		expect(describeWeatherPersonality(view({ shares: withShare('heat', 5, 16.7) }))).toContain(
			'in the heat too: 17%'
		);
		expect(describeWeatherPersonality(view({ shares: withShare('rain', 8, 26.7) }))).toContain(
			"rain doesn't stop me: 27%"
		);
		expect(
			describeWeatherPersonality(
				view({
					hottest: { tempC: 37.6, routeName: 'A', date: '2025-01-01', href: null },
					coldest: { tempC: -3.2, routeName: 'B', date: '2025-06-01', href: null }
				})
			)
		).toBe("I've climbed in everything from -3°C to 38°C.");
	});

	it('shows up in the story as an optional paragraph', () => {
		const blurb = buildClimberBlurb({
			firstDate: '2020-01-01',
			activeDays: 100,
			totalAscents: 300,
			totalSends: 250,
			onsightCount: 50,
			flashCount: 10,
			redpointCount: 80,
			pinkpointCount: 5,
			climberType: 'Sport climber',
			heightM: 5000,
			distinctRoutes: 200,
			distinctCrags: 3,
			outdoorAscents: 250,
			indoorAscents: 50,
			weather: view({ shares: withShare('freeze', 9, 30) })
		});
		expect(blurb.paragraphs.some((p) => p.includes('happy climbing in the cold'))).toBe(true);
		const without = buildClimberBlurb({
			firstDate: '2020-01-01',
			activeDays: 100,
			totalAscents: 300,
			totalSends: 250,
			onsightCount: 50,
			flashCount: 10,
			redpointCount: 80,
			pinkpointCount: 5,
			climberType: 'Sport climber',
			heightM: 5000,
			distinctRoutes: 200,
			distinctCrags: 3,
			outdoorAscents: 250,
			indoorAscents: 50
		});
		expect(without.paragraphs.some((p) => /cold|snow|heat|rain/i.test(p))).toBe(false);
	});
});
