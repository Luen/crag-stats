import { describe, expect, it } from 'vitest';
import {
	buildClimberBlurb,
	classifyPutUpStyle,
	describeDeveloperPreference,
	describeHardest,
	describeHomeCrag,
	describeMostPopularPutUp,
	describePartners,
	describePopularity,
	describeProjects,
	describeSeason,
	describeSendPreference,
	describeSolo,
	describeTravel,
	describeWanderer,
	describeWeatherPersonality,
	putUpCharacter,
	seasonNameForMonth
} from './climberBlurb';
import type { WeatherConditionsView } from '#lib/weatherStats';
import type { DeveloperImpactRoute } from './routeDeveloperImpact';
import { DEFAULT_DATE_DISPLAY } from '#lib/dates';

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
					routeName: 'Crack A',
					gearStyle: 'Trad',
					sportOrBolted: false,
					bolts: null,
					othersAscents: 30
				}),
				route({
					routeExternalId: 't2',
					routeName: 'Crack B',
					gearStyle: 'Trad',
					sportOrBolted: false,
					bolts: null,
					othersAscents: 25
				})
			],
			firstAscentCount: 2
		});
		expect(text).toBe(
			"I like to put up trad routes that other people have climbed over 55 times. I've put up 2 first ascents. The most popular route I've put up is Crack A."
		);
	});

	it('describes mixed community totals as hedged ascent counts, not people', () => {
		const text = describeDeveloperPreference({
			routes: [
				route({ routeName: 'Busy', othersAscents: 40 }),
				route({ routeExternalId: 's2', routeName: 'Quieter', othersAscents: 20 })
			]
		});
		expect(text).toMatch(/climbed over 60 times/i);
		expect(text).toMatch(/most popular route I've put up is Busy/i);
		expect(text).not.toMatch(/more than|people climbing|mega classic/i);
	});

	it('uses obscure adventure wording when most put-ups have little community traffic', () => {
		const text = describeDeveloperPreference({
			routes: [
				route({ routeExternalId: 'a', routeName: 'Hidden', othersAscents: 0 }),
				route({ routeExternalId: 'b', routeName: 'Quiet', othersAscents: 3 }),
				route({ routeExternalId: 'c', routeName: 'Sparse', othersAscents: 5 })
			],
			firstAscentCount: 3
		});
		expect(text).toBe(
			"I like to bolt sport routes — mostly obscure and adventure lines few others have logged. I've put up 3 first ascents. The most popular route I've put up is Sparse."
		);
		expect(text).not.toMatch(/climbed over/i);
	});

	it('uses mega classics wording when most put-ups are busy', () => {
		const text = describeDeveloperPreference({
			routes: [
				route({ routeExternalId: 'a', routeName: 'Crowd Pleaser', othersAscents: 120 }),
				route({ routeExternalId: 'b', routeName: 'Also Busy', othersAscents: 55 }),
				route({ routeExternalId: 'c', routeName: 'Mid', othersAscents: 20 })
			]
		});
		expect(text).toBe(
			"I like to bolt sport routes — mega classics other people keep climbing. The most popular route I've put up is Crowd Pleaser, and it's a mega classic with over 120 ascents!"
		);
		expect(text).not.toMatch(/climbed over/i);
	});

	it('skips character when fewer than two put-ups have community data', () => {
		const text = describeDeveloperPreference({
			routes: [
				route({ routeExternalId: 'a', routeName: 'Only One', othersAscents: 80 }),
				route({ routeExternalId: 'b', routeName: 'Unknown', othersAscents: null })
			]
		});
		expect(text).toMatch(/climbed over 80 times/i);
		expect(text).not.toMatch(/obscure|mega classics other people keep climbing/i);
		expect(text).toMatch(/most popular route I've put up is Only One/i);
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

describe('putUpCharacter / describeMostPopularPutUp (#395)', () => {
	it('classifies obscure and classic majorities', () => {
		expect(
			putUpCharacter([
				route({ routeExternalId: 'a', othersAscents: 1 }),
				route({ routeExternalId: 'b', othersAscents: 4 })
			])
		).toBe('obscure');
		expect(
			putUpCharacter([
				route({ routeExternalId: 'a', othersAscents: 50 }),
				route({ routeExternalId: 'b', othersAscents: 90 })
			])
		).toBe('classic');
		expect(
			putUpCharacter([
				route({ routeExternalId: 'a', othersAscents: 20 }),
				route({ routeExternalId: 'b', othersAscents: 30 })
			])
		).toBeNull();
	});

	it('adds a mega classic flourish only at ≥100 community others', () => {
		expect(
			describeMostPopularPutUp([
				route({ routeName: 'Almost', othersAscents: 99 }),
				route({ routeExternalId: 'b', routeName: 'Lower', othersAscents: 40 })
			])
		).toBe("The most popular route I've put up is Almost.");
		expect(describeMostPopularPutUp([route({ routeName: 'Hit', othersAscents: 100 })])).toBe(
			"The most popular route I've put up is Hit, and it's a mega classic with over 100 ascents!"
		);
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
	const story = (routes: DeveloperImpactRoute[], firstDate: string | null = '2020-01-01') =>
		buildClimberBlurb({
			firstDate,
			activeDays: 1,
			totalAscents: 1,
			totalSends: 1,
			onsightCount: 0,
			flashCount: 0,
			redpointCount: 1,
			pinkpointCount: 0,
			climberType: 'Sport climber',
			heightM: 0,
			distinctRoutes: 1,
			distinctCrags: 1,
			outdoorAscents: 1,
			indoorAscents: 0,
			putUpRoutes: routes,
			dateDisplay: { ...DEFAULT_DATE_DISPLAY, locale: 'de-DE' }
		});

	it('formats the community estimate and links only the selected route-name span', () => {
		for (const firstDate of ['2020-01-01', null]) {
			const blurb = story(
				[
					route({ routeName: 'Quieter', othersAscents: 120 }),
					route({
						routeName: 'Insight <test> & friends',
						othersAscents: 1234,
						ascentCount: 1236,
						url: 'https://www.thecrag.com/en/climbing/test/route/123',
						routeExternalId: '123'
					})
				],
				firstDate
			);
			const link = blurb.routeLink!;
			const paragraph = blurb.paragraphs[link.paragraph];
			expect(paragraph).toContain("it's a mega classic with over 1.234 ascents!");
			expect(paragraph).not.toContain('1236');
			expect(paragraph.slice(link.start, link.end)).toBe('Insight <test> & friends');
			expect(link.href).toBe('https://www.thecrag.com/en/climbing/test/route/123');
			expect(paragraph).not.toContain('<a');
		}
	});

	it('uses safe canonical links and omits links when the name is not in the story', () => {
		const blurb = story([
			route({ routeExternalId: '123', url: 'javascript:alert(1)', othersAscents: 100 })
		]);
		expect(blurb.routeLink?.href).toBe('https://www.thecrag.com/en/route/123');
		expect(
			story([route({ routeExternalId: 'unknown', url: 'https://evil.example/route/123' })])
				.routeLink
		).toBeNull();
		expect(story([route({ othersAscents: null })]).routeLink).toBeNull();
		expect(
			story([route({ gearStyle: 'Unknown', sportOrBolted: false, bolts: null })]).routeLink
		).toBeNull();
	});

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
		fairWeather: null,
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

	it('names the weather-day denominator when half the outdoor days are unknown', () => {
		expect(
			describeWeatherPersonality(
				view({
					withWeather: 20,
					outdoorDays: 40,
					withoutWeather: 20,
					shares: withShare('freeze', 10, 50)
				})
			)
		).toBe(
			"I'm happy climbing in the cold: 50% of my outdoor days with weather dipped to freezing or below."
		);
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
