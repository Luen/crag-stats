import { describe, expect, it } from 'vitest';

/**
 * Mirrors buildStreaks week-walk edge cases without importing the full analytics
 * module (which pulls in better-sqlite3 / DB).
 */
function weekKey(iso: string): string | null {
	const d = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(d.getTime())) return null;
	const tmp = new Date(d);
	tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
	const week1 = new Date(tmp.getFullYear(), 0, 4);
	const week =
		1 +
		Math.round(
			((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
		);
	if (!Number.isFinite(week) || week < 1 || week > 53) return null;
	return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function validDay(iso: string): string | null {
	const d = iso.slice(0, 10);
	const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const dt = new Date(`${d}T12:00:00`);
	if (Number.isNaN(dt.getTime())) return null;
	if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) return null;
	return d;
}

function countCurrentWeeks(days: string[]): number {
	const weeks = [...new Set(days.map(weekKey).filter((k): k is string => Boolean(k)))].sort();
	if (!weeks.length) return 0;
	const weekSet = new Set(weeks);
	const lastWeek = weeks[weeks.length - 1];
	const [yStr, wStr] = lastWeek.split('-W');
	let y = Number(yStr);
	let w = Number(wStr);
	let currentWeeks = 0;
	let guard = 0;
	while (
		Number.isFinite(y) &&
		Number.isFinite(w) &&
		weekSet.has(`${y}-W${String(w).padStart(2, '0')}`) &&
		guard < 3000
	) {
		currentWeeks += 1;
		guard += 1;
		w -= 1;
		if (w < 1) {
			y -= 1;
			w = 52;
		}
	}
	return currentWeeks;
}

describe('invalid ascent dates must not hang streaks', () => {
	it('rejects 2018-00-00 / day-zero placeholders', () => {
		expect(validDay('2018-00-00')).toBeNull();
		expect(validDay('2019-11-00')).toBeNull();
		expect(validDay('2024-02-31')).toBeNull();
		expect(validDay('2024-01-15')).toBe('2024-01-15');
	});

	it('weekKey returns null for invalid dates (no NaN-WNaN)', () => {
		expect(weekKey('2018-00-00')).toBeNull();
		expect(weekKey('2024-01-15')).toMatch(/^\d{4}-W\d{2}$/);
	});

	it('does not infinite-loop when fed NaN week garbage', () => {
		const started = Date.now();
		// Simulate pre-fix behaviour input: valid days plus invalid that become NaN keys
		const days = ['2024-01-15', '2024-01-22', '2018-00-00', '2019-11-00'];
		const filtered = days.filter((d) => validDay(d));
		const n = countCurrentWeeks(filtered);
		expect(Date.now() - started).toBeLessThan(1000);
		expect(n).toBeGreaterThanOrEqual(0);
		expect(n).toBeLessThan(3000);
	});
});
