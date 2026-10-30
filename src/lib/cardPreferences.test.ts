import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	CARD_PREFERENCE_KEYS,
	normalizeCardPreference,
	readCardPreferences
} from './cardPreferences';
describe('card preferences', () => {
	it('whitelists cookie values without sharing state between requests', () => {
		const first = readCardPreferences((key) =>
			key === 'cs_partners_metric' ? 'sessions' : undefined
		);
		const second = readCardPreferences(() => '<script>');
		expect(first.cs_partners_metric).toBe('sessions');
		expect(Object.values(second)).toEqual([null, null, null, null, null, null]);
	});
	it('migrates legacy chart tabs and rejects unsupported values', () => {
		for (const old of ['byYear', 'career'])
			expect(normalizeCardPreference('cs_yearly_chart', old)).toBe('cumulative');
		expect(normalizeCardPreference('cs_weekday_metric', 'areas')).toBeNull();
		expect(normalizeCardPreference('cs_heatmap_mode', 'weather')).toBe('weather');
	});
	it('keeps the pre-paint migration key list in app.html in sync', () => {
		const html = readFileSync('src/app.html', 'utf8');
		const listed = [...html.matchAll(/'(cs_[a-z_]+)'/g)]
			.map((m) => m[1])
			.filter((k) => k !== 'cs_theme' && k !== 'cs_sidebar');
		expect(listed).toEqual(CARD_PREFERENCE_KEYS);
	});
});
