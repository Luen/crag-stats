import { describe, expect, it } from 'vitest';
import {
	DEFAULT_LOCALE,
	LOCALE_METADATA,
	SUPPORTED_LOCALES,
	isSupportedLocale,
	normalizeLocale
} from './types';
import { formatMessage, LOCALES } from './format';
import { t } from './context.svelte';

describe('i18n locales and types', () => {
	it('defines supported locales including en, de, fr, es, and it', () => {
		expect(SUPPORTED_LOCALES).toEqual(['en', 'de', 'fr', 'es', 'it']);
		expect(DEFAULT_LOCALE).toBe('en');
	});

	it('validates supported locales with isSupportedLocale', () => {
		expect(isSupportedLocale('en')).toBe(true);
		expect(isSupportedLocale('de')).toBe(true);
		expect(isSupportedLocale('fr')).toBe(true);
		expect(isSupportedLocale('es')).toBe(true);
		expect(isSupportedLocale('it')).toBe(true);
		expect(isSupportedLocale('jp')).toBe(false);
		expect(isSupportedLocale(null)).toBe(false);
		expect(isSupportedLocale('')).toBe(false);
	});

	it('normalizes locale tags from headers or environment variables', () => {
		expect(normalizeLocale('en')).toBe('en');
		expect(normalizeLocale('en-AU')).toBe('en');
		expect(normalizeLocale('de-DE')).toBe('de');
		expect(normalizeLocale('fr_FR')).toBe('fr');
		expect(normalizeLocale('es-ES')).toBe('es');
		expect(normalizeLocale('it-IT')).toBe('it');
		expect(normalizeLocale('zh-CN')).toBe('en');
		expect(normalizeLocale(null)).toBe('en');
		expect(normalizeLocale(undefined)).toBe('en');
	});

	it('provides metadata for all supported locales', () => {
		for (const locale of SUPPORTED_LOCALES) {
			const meta = LOCALE_METADATA[locale];
			expect(meta).toBeDefined();
			expect(meta.code).toBe(locale);
			expect(meta.name.length).toBeGreaterThan(0);
			expect(meta.nativeName.length).toBeGreaterThan(0);
			expect(meta.flag.length).toBeGreaterThan(0);
		}
	});

	it('has loaded catalogs for all supported locales with matching top-level keys', () => {
		const enKeys = Object.keys(LOCALES.en).sort();
		for (const locale of SUPPORTED_LOCALES) {
			const localeKeys = Object.keys(LOCALES[locale]).sort();
			expect(localeKeys).toEqual(enKeys);
		}
	});
});

describe('formatMessage', () => {
	it('translates navigation keys in English', () => {
		expect(formatMessage('en', 'nav.dashboard')).toBe('Dashboard');
		expect(formatMessage('en', 'nav.logbook')).toBe('Logbook');
		expect(formatMessage('en', 'nav.projects')).toBe('Projects');
		expect(formatMessage('en', 'nav.settings')).toBe('Settings');
	});

	it('translates navigation keys in German, French, Spanish, and Italian', () => {
		expect(formatMessage('de', 'nav.dashboard')).toBe('Übersicht');
		expect(formatMessage('de', 'nav.logbook')).toBe('Tourenbuch');

		expect(formatMessage('fr', 'nav.dashboard')).toBe('Tableau de bord');
		expect(formatMessage('fr', 'nav.logbook')).toBe('Carnet de croix');

		expect(formatMessage('es', 'nav.dashboard')).toBe('Panel principal');
		expect(formatMessage('es', 'nav.logbook')).toBe('Libro de vías');

		expect(formatMessage('it', 'nav.dashboard')).toBe('Dashboard');
		expect(formatMessage('it', 'nav.logbook')).toBe('Logbook');
	});

	it('interpolates parameters correctly', () => {
		const result = formatMessage('en', 'theme.themeLabel', {
			current: 'Light',
			next: 'Dark'
		});
		expect(result).toBe('Theme: Light. Switch to Dark');
	});

	it('formats ICU plurals for single and plural counts', () => {
		expect(formatMessage('en', 'dashboard.ascentsCount', { count: 1 })).toBe('1 ascent');
		expect(formatMessage('en', 'dashboard.ascentsCount', { count: 5 })).toBe('5 ascents');
		expect(formatMessage('en', 'dashboard.ascentsCount', { count: 0 })).toBe('0 ascents');

		expect(formatMessage('de', 'dashboard.ascentsCount', { count: 1 })).toBe('1 Begehung');
		expect(formatMessage('de', 'dashboard.ascentsCount', { count: 4 })).toBe('4 Begehungen');

		expect(formatMessage('fr', 'dashboard.ascentsCount', { count: 1 })).toBe('1 ascension');
		expect(formatMessage('fr', 'dashboard.ascentsCount', { count: 2 })).toBe('2 ascensions');

		expect(formatMessage('es', 'dashboard.ascentsCount', { count: 1 })).toBe('1 ascensión');
		expect(formatMessage('es', 'dashboard.ascentsCount', { count: 3 })).toBe('3 ascensiones');

		expect(formatMessage('it', 'dashboard.ascentsCount', { count: 1 })).toBe('1 salita');
		expect(formatMessage('it', 'dashboard.ascentsCount', { count: 6 })).toBe('6 salite');
	});

	it('falls back to English when a key is missing in another locale', () => {
		const customKey = 'common.save';
		expect(formatMessage('de', customKey)).toBe('Speichern');
		// Non-existent in de falls back to en
		expect(formatMessage('de', 'nonexistent.key.test')).toBe('nonexistent.key.test');
	});

	it('returns the raw key when missing in all catalogs', () => {
		expect(formatMessage('en', 'completely.unknown.key')).toBe('completely.unknown.key');
	});

	it('translates climbing grade bands accurately across locales', () => {
		expect(formatMessage('en', 'grades.bands.beginner')).toBe('Beginner');
		expect(formatMessage('de', 'grades.bands.beginner')).toBe('Anfänger');
		expect(formatMessage('fr', 'grades.bands.beginner')).toBe('Débutant');
		expect(formatMessage('es', 'grades.bands.beginner')).toBe('Principiante');
		expect(formatMessage('it', 'grades.bands.beginner')).toBe('Principiante');
	});

	it('translates tick kinds across locales', () => {
		expect(formatMessage('en', 'ticks.onsight')).toBe('Onsight');
		expect(formatMessage('fr', 'ticks.onsight')).toBe('À vue');
		expect(formatMessage('es', 'ticks.onsight')).toBe('A vista');
		expect(formatMessage('de', 'ticks.redpoint')).toBe('Rotpunkt');
		expect(formatMessage('fr', 'ticks.redpoint')).toBe('Après travail');
		expect(formatMessage('es', 'ticks.send')).toBe('Encadene');
		expect(formatMessage('it', 'ticks.send')).toBe('Chiusura');
	});
});

describe('i18n context and reactivity', () => {
	it('formats messages with standalone t function', () => {
		expect(t('nav.dashboard', undefined, 'de')).toBe('Übersicht');
		expect(t('nav.dashboard', undefined, 'fr')).toBe('Tableau de bord');
		expect(t('nav.dashboard', undefined, 'es')).toBe('Panel principal');
		expect(t('nav.dashboard', undefined, 'it')).toBe('Dashboard');
		expect(t('nav.dashboard', undefined, 'en')).toBe('Dashboard');
	});

	it('handles plural exact matches and numbers gracefully', () => {
		expect(formatMessage('en', 'projects.sessions', { count: 1 })).toBe('1 session');
		expect(formatMessage('en', 'projects.sessions', { count: 12 })).toBe('12 sessions');
		expect(formatMessage('de', 'projects.sessions', { count: 1 })).toBe('1 Session');
		expect(formatMessage('de', 'projects.sessions', { count: 5 })).toBe('5 Sessions');
	});
});
