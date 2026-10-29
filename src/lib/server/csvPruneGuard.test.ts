import { describe, expect, it } from 'vitest';
import {
	assessCsvExportForPrune,
	assertCsvExportPlausibleForPrune,
	CSV_PRUNE_MIN_LOCAL,
	CSV_PRUNE_MIN_REMAINING_RATIO
} from './csvPruneGuard';

describe('assessCsvExportForPrune', () => {
	it('allows first import and growth', () => {
		expect(assessCsvExportForPrune(0, 0)).toEqual({ ok: true });
		expect(assessCsvExportForPrune(0, 50)).toEqual({ ok: true });
		expect(assessCsvExportForPrune(100, 120)).toEqual({ ok: true });
	});

	it('allows modest deletes on a large logbook', () => {
		// 1000 → 600 keeps 60% (≥ 50%)
		expect(assessCsvExportForPrune(1000, 600)).toEqual({ ok: true });
		expect(
			assessCsvExportForPrune(CSV_PRUNE_MIN_LOCAL, Math.ceil(CSV_PRUNE_MIN_LOCAL * 0.5))
		).toEqual({ ok: true });
	});

	it('refuses an empty export when local data exists', () => {
		const r = assessCsvExportForPrune(10, 0);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe('empty-export');
	});

	it('refuses a massive drop on a large logbook (1000 → 230)', () => {
		const r = assessCsvExportForPrune(1000, 230);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.reason).toBe('massive-drop');
			expect(r.message).toMatch(/1000/);
			expect(r.message).toMatch(/230/);
		}
		expect(230 / 1000).toBeLessThan(CSV_PRUNE_MIN_REMAINING_RATIO);
	});

	it('does not apply the ratio guard below the local minimum', () => {
		// 80 → 20 would be a 75% drop, but local < 100 so prune is allowed.
		expect(CSV_PRUNE_MIN_LOCAL).toBeGreaterThan(80);
		expect(assessCsvExportForPrune(80, 20)).toEqual({ ok: true });
	});
});

describe('assertCsvExportPlausibleForPrune', () => {
	it('throws on massive drop', () => {
		expect(() => assertCsvExportPlausibleForPrune(1000, 230)).toThrow(/Refusing CSV sync/);
	});

	it('does not throw when plausible', () => {
		expect(() => assertCsvExportPlausibleForPrune(1000, 900)).not.toThrow();
	});
});
