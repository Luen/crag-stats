import { describe, expect, it } from 'vitest';
import { displayStyle, logbookStyleLabels, soloKind } from './logbookStyle';

describe('logbookStyleLabels', () => {
	it('shows route discipline and free solo together', () => {
		expect(
			logbookStyleLabels({
				tickType: 'Red point',
				ascentGearStyle: 'solo',
				gearStyle: 'trad'
			})
		).toEqual(['Trad', 'Free solo']);
	});

	it('shows sport discipline only for a normal send', () => {
		expect(
			logbookStyleLabels({
				tickType: 'Onsight',
				ascentGearStyle: 'sport',
				gearStyle: 'sport'
			})
		).toEqual(['Sport']);
	});

	it('detects deep water solo from ascent gear style', () => {
		expect(soloKind({ tickType: 'Flash', ascentGearStyle: 'dws' })).toBe('dws');
		expect(
			logbookStyleLabels({
				tickType: 'Flash',
				ascentGearStyle: 'dws',
				gearStyle: 'boulder'
			})
		).toEqual(['Boulder', 'Deep water solo']);
	});
});

describe('displayStyle', () => {
	it('maps theCrag gear styles to dashboard buckets', () => {
		expect(displayStyle('Sport')).toBe('Sport');
		expect(displayStyle('unknown')).toBe('Other');
	});
});

it.each(['sport', 'trad'])('retains a top-rope ascent on a %s route (#125)', (gearStyle) => {
	expect(logbookStyleLabels({ tickType: 'Tick', gearStyle, ascentGearStyle: 'toprope' })).toContain(
		'Top rope'
	);
});
