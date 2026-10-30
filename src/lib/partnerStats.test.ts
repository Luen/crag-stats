import { describe, expect, it } from 'vitest';
import {
	buildPartnerStats,
	partnerAreaKey,
	partnerMetricLabel,
	partnerMetricValue,
	sortPartners,
	splitPartners
} from './partnerStats';

describe('splitPartners', () => {
	it('splits on commas, and, semicolons, and strips @handles', () => {
		expect(splitPartners('@alice, Bob and carol;@dave')).toEqual(['alice', 'Bob', 'carol', 'dave']);
	});

	it('handles slash separators and empty input', () => {
		expect(splitPartners('Sam / @kim')).toEqual(['Sam', 'kim']);
		expect(splitPartners(null)).toEqual([]);
		expect(splitPartners('  ')).toEqual([]);
	});
});

describe('buildPartnerStats', () => {
	it('counts ascents, unique session days, and unique crags', () => {
		const stats = buildPartnerStats([
			{ ascentDate: '2024-01-01', partners: '@alice, Bob', cragName: 'Castle Hill' },
			{ ascentDate: '2024-01-01', partners: 'alice', cragName: 'Castle Hill' }, // same day
			{ ascentDate: '2024-01-02', partners: 'alice', cragName: 'Mt Stuart' },
			{ ascentDate: '2024-01-03', partners: 'Bob', cragName: 'Castle Hill' },
			{ ascentDate: '2018-00-00', partners: 'Bob', cragName: 'Unknown' },
			{ ascentDate: '2024-01-04', partners: 'Bob', cragName: 'Unknown' },
			{ ascentDate: '2024-01-05', partners: 'Bob', cragName: null }
		]);

		const alice = stats.find((p) => p.name === 'alice')!;
		const bob = stats.find((p) => p.name === 'Bob')!;
		expect(alice).toEqual({ name: 'alice', ascents: 3, sessions: 2, areas: 2 });
		expect(bob.ascents).toBe(5); // Jan1 shared + Jan3 + invalid + Unknown + null
		expect(bob.sessions).toBe(4); // 1, 3, 4, 5 Jan (invalid day skipped)
		expect(bob.areas).toBe(1); // Castle Hill only (Unknown/blank skipped)
		expect(partnerAreaKey('Unknown')).toBeNull();
		expect(partnerAreaKey('Castle Hill')).toBe('castle hill');
		expect(partnerAreaKey('castle hill')).toBe('castle hill');
	});

	it('treats crag names case-insensitively for areas', () => {
		const stats = buildPartnerStats([
			{ ascentDate: '2024-01-01', partners: 'Pat', cragName: 'Castle Hill' },
			{ ascentDate: '2024-01-02', partners: 'Pat', cragName: 'castle hill' },
			{ ascentDate: '2024-01-03', partners: 'Pat', cragName: 'Mt Stuart' }
		]);
		expect(stats.find((p) => p.name === 'Pat')).toEqual({
			name: 'Pat',
			ascents: 3,
			sessions: 3,
			areas: 2
		});
	});

	it('sorts by the selected metric', () => {
		const stats = buildPartnerStats([
			{ ascentDate: '2024-01-01', partners: 'ManyTicks', cragName: 'A' },
			{ ascentDate: '2024-01-01', partners: 'ManyTicks', cragName: 'A' },
			{ ascentDate: '2024-01-01', partners: 'ManyTicks', cragName: 'A' },
			{ ascentDate: '2024-02-01', partners: 'Traveller', cragName: 'A' },
			{ ascentDate: '2024-03-01', partners: 'Traveller', cragName: 'B' },
			{ ascentDate: '2024-04-01', partners: 'Traveller', cragName: 'C' }
		]);
		expect(sortPartners(stats, 'ascents')[0]?.name).toBe('ManyTicks');
		expect(sortPartners(stats, 'areas')[0]?.name).toBe('Traveller');
		expect(
			partnerMetricValue(
				stats.find((p) => p.name === 'Traveller')!,
				'sessions'
			)
		).toBe(3);
		expect(partnerMetricLabel('areas', 1)).toBe('area');
		expect(partnerMetricLabel('sessions', 2)).toBe('sessions');
	});
});

it('counts stable area identities across renames and distinguishes identical display names', () => {
	const [p] = buildPartnerStats([
		{ partners: 'Pat', cragName: 'Old name', areaKey: 'thecrag:area:1' },
		{ partners: 'Pat', cragName: 'New name', areaKey: 'thecrag:area:1' },
		{ partners: 'Pat', cragName: 'New name', areaKey: 'thecrag:area:2' },
		{ partners: 'Pat', cragName: null, areaKey: 'thecrag:area:3' },
		{ partners: 'Pat', cragName: 'Old name' }
	]);
	expect(p?.areas).toBe(3);
});

it('falls back to normalized names without ids and does not merge provider namespaces', () => {
	const [p] = buildPartnerStats([
		{ partners: 'Pat', cragName: 'Only name' },
		{ partners: 'Pat', cragName: 'ONLY NAME' },
		{ partners: 'Pat', cragName: 'Unknown' },
		{ partners: 'Pat', cragName: '' },
		{ partners: 'Pat', cragName: 'Same', areaKey: 'thecrag:area:1' },
		{ partners: 'Pat', cragName: 'Same', areaKey: 'other:area:1' }
	]);
	expect(p?.areas).toBe(3);
});

it('counts a shared ascent once per normalized partner identity', () => {
	expect(
		buildPartnerStats([{ partners: '@Pat, pat and PAT', ascentDate: '2024-01-01', cragName: 'A' }])
	).toEqual([{ name: 'Pat', ascents: 1, sessions: 1, areas: 1 }]);
});
