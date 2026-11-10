import { beforeEach, describe, expect, it } from 'vitest';
import { convertFromEwbank, convertFromVScale } from '#lib/grades';
import { upsertAscents } from './ingest';
import { getRewindSummary } from './rewind';
import { wipeAllData } from './wipe';

function send(
	id: string,
	date: string,
	grade: string,
	score: number,
	style: string,
	system: string
) {
	return {
		provider: 'thecrag',
		externalId: id,
		ascentDate: date,
		tickType: 'Red point',
		isSend: true,
		isAttempt: false,
		effectiveGradeRaw: grade,
		effectiveGradeScore: score,
		route: {
			provider: 'thecrag',
			externalId: `r-${id}`,
			name: `Synthetic ${id}`,
			gradeRaw: grade,
			gradeScore: score,
			gradeSystem: system,
			gearStyle: style
		}
	};
}

beforeEach(() => wipeAllData());

describe('Rewind hardest send label (#442)', () => {
	it('formats a stored Ewbank score in the preferred grade system', () => {
		upsertAscents([send('a', '2026-03-01', '24', 24, 'Sport', 'ewbank')]);
		expect(
			getRewindSummary(2026, { route: 'french', boulder: 'v_scale' }).hardestSend?.gradeRaw
		).toBe(convertFromEwbank(24, 'french'));
		expect(getRewindSummary(2026, { route: 'yds', boulder: 'v_scale' }).hardestSend?.gradeRaw).toBe(
			convertFromEwbank(24, 'yds')
		);
		expect(getRewindSummary(2026).hardestSend?.gradeRaw).toBe('24');
	});

	it('keeps V-scale labels for boulders', () => {
		upsertAscents([send('b', '2026-03-01', 'V5', 5, 'Boulder', 'v_scale')]);
		expect(
			getRewindSummary(2026, { route: 'french', boulder: 'v_scale' }).hardestSend?.gradeRaw
		).toBe('V5');
	});

	it('uses the boulder system independently of the route system', () => {
		upsertAscents([send('c', '2026-03-01', 'V5', 5, 'Boulder', 'v_scale')]);
		expect(getRewindSummary(2026, { route: 'french', boulder: 'font' }).hardestSend?.gradeRaw).toBe(
			convertFromVScale(5, 'font')
		);
	});
});
