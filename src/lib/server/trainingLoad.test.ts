import { describe, expect, it } from 'vitest';
import type { DashboardExtraRow } from './dashboardExtras';
import { ascentIntensity, buildTrainingLoadView, loadStatus, styleFactor } from './trainingLoad';

const TODAY = '2026-10-27';

function day(offset: number): string {
	return new Date(Date.parse(`${TODAY}T00:00:00Z`) - offset * 86_400_000)
		.toISOString()
		.slice(0, 10);
}

function send(
	offset: number,
	grade: number,
	extra: Partial<DashboardExtraRow> = {}
): DashboardExtraRow {
	return { ascentDate: day(offset), gearStyle: 'Sport', isSend: true, gradeScore: grade, ...extra };
}

describe('ascentIntensity', () => {
	it('is 1 at the year max and halves every 2 Ewbank / 1 V-grade below', () => {
		expect(ascentIntensity(24, 24, 'route')).toBe(1);
		expect(ascentIntensity(22, 24, 'route')).toBeCloseTo(0.5);
		expect(ascentIntensity(4, 5, 'boulder')).toBeCloseTo(0.5);
	});
	it('is capped above the max and floored far below it', () => {
		expect(ascentIntensity(30, 24, 'route')).toBe(1.5);
		expect(ascentIntensity(5, 24, 'route')).toBe(0.05);
	});
	it('gives ungraded ascents a light default', () => {
		expect(ascentIntensity(null, 24, 'route')).toBe(0.3);
	});
});

describe('styleFactor / loadStatus', () => {
	it('weights attempts and top-roping lower than lead sends', () => {
		expect(styleFactor({ ascentDate: TODAY, isSend: true, gearStyle: 'Sport' })).toBe(1);
		expect(styleFactor({ ascentDate: TODAY, isSend: false, gearStyle: 'Sport' })).toBeCloseTo(0.8);
		expect(styleFactor({ ascentDate: TODAY, isSend: true, gearStyle: 'Top rope' })).toBeCloseTo(
			0.8
		);
	});
	it('maps the ratio to ACWR bands', () => {
		expect(loadStatus(null, 0)).toBe('idle');
		expect(loadStatus(0.6, 2)).toBe('detraining');
		expect(loadStatus(1, 2)).toBe('optimal');
		expect(loadStatus(1.4, 2)).toBe('building');
		expect(loadStatus(1.8, 2)).toBe('spike');
	});
});

describe('buildTrainingLoadView', () => {
	it('uses the trailing-year max per discipline as the reference', () => {
		const view = buildTrainingLoadView(
			[
				send(400, 28), // older than a year: ignored
				send(100, 24),
				send(50, 6, { gearStyle: 'Boulder' }),
				send(3, 22)
			],
			TODAY
		);
		expect(view.refRoute).toBe(24);
		expect(view.refBoulder).toBe(6);
	});

	it('flags a spike when the last week is far above the usual load', () => {
		const steady = Array.from({ length: 12 }, (_, w) => send(30 + w * 7, 20));
		const burst = Array.from({ length: 12 }, (_, i) => send(i % 5, 23));
		const view = buildTrainingLoadView([send(200, 24), ...steady, ...burst], TODAY);
		expect(view.ratio).not.toBeNull();
		expect(view.ratio!).toBeGreaterThan(1.5);
		expect(view.status).toBe('spike');
		expect(view.limitSends28).toBe(12);
		expect(view.weekly).toHaveLength(12);
	});

	it('is idle with no recent climbing', () => {
		const view = buildTrainingLoadView([send(300, 20)], TODAY);
		expect(view.status).toBe('idle');
		expect(view.acute).toBe(0);
	});
});
