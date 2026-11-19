import { describe, expect, it } from 'vitest';
import type { DashboardStats } from '#lib/types/dashboard';
import {
	EMBED_CARDS,
	escapeXml,
	isEmbedCard,
	parseEmbedTheme,
	renderEmbedCard
} from './embedCards';

const metric = { value: 3, next: 4, needed: 2 };

// Only the fields the cards read; the rest of DashboardStats is irrelevant here.
const stats = {
	profileName: 'Alex <script>',
	climberType: 'Sport climber',
	totalAscents: 120,
	totalSends: 90,
	onsightCount: 30,
	heightKm: 2.4,
	blurb: { startedOn: null, durationLabel: '3 years', paragraphs: [] },
	styleShare: [{ style: 'Sport', count: 120, pct: 100, color: '#1d6fa5' }],
	stylePyramidsByMode: {
		all: [],
		onsight: [],
		sends: [
			{
				style: 'Sport',
				total: 90,
				system: 'ewbank',
				rows: [
					{ grade: '22', score: 22, band: 3, color: '#e58329', total: 1, segments: [], href: '' }
				]
			}
		]
	},
	hardestSends: [
		{
			routeName: 'Rock & Roll',
			gradeRaw: '22',
			gradeLabel: '22',
			gradeBand: 3,
			pitchLabel: null,
			tickType: 'Red point',
			ascentDate: '2025-04-01',
			cragName: 'Frog Buttress',
			cragUrl: null,
			url: null
		}
	],
	eddington: {
		sends: metric,
		vertical: metric,
		verticalUnitM: 10,
		routeGrade: metric,
		boulderGrade: metric,
		activeDays: 12
	}
} as unknown as DashboardStats;

describe('embed cards', () => {
	it('localises SVG labels and numbers without changing route names or grade notation', () => {
		const summary = renderEmbedCard(
			'summary',
			{ ...stats, totalAscents: 1234 },
			'light',
			undefined,
			'de'
		);
		expect(summary).toContain('1.234');
		expect(summary).toContain('2,4 km');
		expect(summary).toContain('Begehungen');
		expect(summary).toContain('Schwerste Durchstiege');
		const hardest = renderEmbedCard('hardest', stats, 'dark', undefined, 'de');
		expect(hardest).toContain('Rock &amp; Roll');
		expect(hardest).toContain('Schwerste Durchstiege');
		expect(hardest).not.toContain('Hardest sends');
		const eddington = renderEmbedCard('eddington', stats, 'light', undefined, 'de');
		expect(eddington).toContain('Routengrad-Index');
		expect(eddington).toContain('Noch 2 Routen');
		expect(eddington).not.toContain('more routes');
	});
	it('formats Eddington grade thresholds in the selected systems while retaining counts', () => {
		const selected = {
			...stats,
			eddington: {
				...stats.eddington,
				routeGrade: { value: 21, next: 22, needed: 8 },
				boulderGrade: { value: 4, next: 5, needed: 4 }
			},
			gradeSystems: { route: 'french', boulder: 'v_scale' }
		} as DashboardStats;
		const svg = renderEmbedCard('eddington', selected, 'light');
		expect(svg).toContain('>21<');
		expect(svg).toContain('>4<');
		expect(svg).not.toContain('>V4<');
		expect(svg).toContain('route grade index');
		expect(svg).toContain('21 routes sent at French 6b+ or harder');
		expect(svg).toContain('4 problems sent at V4 or harder');
		expect(svg).toContain('4 more problems at ≥ V5 for index 5');
		const font = renderEmbedCard(
			'eddington',
			{ ...selected, gradeSystems: { route: 'ewbank', boulder: 'font' } },
			'dark'
		);
		expect(font).toContain('>21<');
		expect(font).toContain('>4<');
		expect(font).toContain('21 routes sent at Ewbank 21 or harder');
		expect(font).toContain('4 problems sent at Font 6B or harder');
	});
	it('validates card ids and themes', () => {
		expect(EMBED_CARDS.every(isEmbedCard)).toBe(true);
		expect(isEmbedCard('notes')).toBe(false);
		expect(parseEmbedTheme('dark')).toBe('dark');
		expect(parseEmbedTheme('<x>')).toBe('light');
	});

	it('escapes user-controlled text', () => {
		expect(escapeXml(`a<b>&"'`)).toBe('a&lt;b&gt;&amp;&quot;&apos;');
		for (const card of EMBED_CARDS) {
			const svg = renderEmbedCard(card, stats, 'light');
			expect(svg.startsWith('<svg')).toBe(true);
			expect(svg).not.toContain('<script>');
			expect(svg).toContain('Alex &lt;script&gt;');
		}
		expect(renderEmbedCard('hardest', stats, 'dark')).toContain('Rock &amp; Roll');
	});
});
