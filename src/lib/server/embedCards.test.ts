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
