import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_LOCALE,
	LOCALE_METADATA,
	SUPPORTED_LOCALES,
	isSupportedLocale,
	matchAcceptLanguage,
	matchSupportedLocale,
	normalizeLocale,
	resolveLocale
} from './types';
import { formatMessage, LOCALES } from './format';

function flattenLeaves(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${k}` : k;
		if (typeof v === 'string') {
			out[path] = v;
		} else if (v && typeof v === 'object') {
			Object.assign(out, flattenLeaves(v as Record<string, unknown>, path));
		}
	}
	return out;
}

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function walkSourceFiles(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			// Catalogues are data, and tests assert their own literal keys.
			if (entry.name === 'i18n' || entry.name === 'node_modules') continue;
			walkSourceFiles(full, out);
		} else if (/\.(svelte|ts)$/.test(entry.name) && !/\.(test|spec)\.ts$/.test(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

/**
 * Collect dotted string literals whose first segment is a catalogue section. This catches
 * `t('nav.map')`, `i18n.t('ticks.send')`, and key tables such as `BAND_KEYS` without
 * requiring a specific call shape.
 */
function collectReferencedKeys(): Map<string, Set<string>> {
	const en = LOCALES.en as Record<string, unknown>;
	const sections = new Set(Object.keys(en));
	const pattern = /['"`]([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"`]/g;
	const referenced = new Map<string, Set<string>>();
	for (const file of walkSourceFiles(SRC_DIR)) {
		const source = fs.readFileSync(file, 'utf8');
		for (const match of source.matchAll(pattern)) {
			const key = match[1];
			if (!sections.has(key.split('.')[0])) continue;
			const files = referenced.get(key) ?? new Set<string>();
			files.add(path.relative(SRC_DIR, file));
			referenced.set(key, files);
		}
	}
	return referenced;
}

function lookupKey(catalog: Record<string, unknown>, key: string): unknown {
	return key.split('.').reduce<unknown>((node, part) => {
		if (!node || typeof node !== 'object') return undefined;
		return (node as Record<string, unknown>)[part];
	}, catalog);
}

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

	it('distinguishes explicit English tags from unsupported tags with matchSupportedLocale', () => {
		expect(matchSupportedLocale('en')).toBe('en');
		expect(matchSupportedLocale('en-AU')).toBe('en');
		expect(matchSupportedLocale('de-DE')).toBe('de');
		expect(matchSupportedLocale('de;q=0.9')).toBe('de');
		expect(matchSupportedLocale('fr_FR')).toBe('fr');
		expect(matchSupportedLocale('zh-CN')).toBeNull();
		expect(matchSupportedLocale(null)).toBeNull();
		expect(matchSupportedLocale(undefined)).toBeNull();
	});

	it('normalises locale tags from headers or environment variables', () => {
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

	it('parses Accept-Language headers with quality weights and unsupported prefixes', () => {
		expect(matchAcceptLanguage('de;q=0.9')).toBe('de');
		expect(matchAcceptLanguage('nl-NL, de-DE;q=0.9, en;q=0.8')).toBe('de');
		expect(matchAcceptLanguage('fr;q=0.7, it-IT;q=0.9, es;q=0.8')).toBe('it');
		expect(matchAcceptLanguage('en-US, de;q=0.9')).toBe('en');
		expect(matchAcceptLanguage('zh-CN, ja;q=0.9')).toBeNull();
		expect(matchAcceptLanguage(null)).toBeNull();
	});

	it('resolves locale across the full priority hierarchy', () => {
		// 1. Query wins over cookie and stored
		expect(
			resolveLocale({
				query: 'it',
				cookie: 'fr',
				stored: 'de',
				displayLocale: 'es-ES',
				acceptLanguage: 'de-DE'
			})
		).toBe('it');

		// 2. Cookie wins over stored
		expect(
			resolveLocale({
				query: null,
				cookie: 'fr',
				stored: 'de',
				displayLocale: 'es-ES',
				acceptLanguage: 'de-DE'
			})
		).toBe('fr');

		// 3. Explicit stored 'de' wins over Accept-Language and displayLocale when query and cookie are unset
		expect(
			resolveLocale({
				query: null,
				cookie: null,
				stored: 'de',
				displayLocale: 'es-ES',
				acceptLanguage: 'fr-FR,fr;q=0.9'
			})
		).toBe('de');

		// 4. Accept-Language autodetects when stored is unset or auto
		expect(
			resolveLocale({
				query: null,
				cookie: null,
				stored: null,
				displayLocale: 'es-AR',
				acceptLanguage: 'de-DE'
			})
		).toBe('de');

		// 5. displayLocale wins when Accept-Language is unsupported or unset
		expect(
			resolveLocale({
				query: 'invalid',
				cookie: undefined,
				stored: '',
				displayLocale: 'es-AR',
				acceptLanguage: 'zh-CN, ja;q=0.9'
			})
		).toBe('es');

		// 6. Fallback to DEFAULT_LOCALE ('en') when all sources are unset or unsupported
		expect(resolveLocale({})).toBe('en');
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

	it('never carries target keys that English does not define', () => {
		// Targets may lag behind `en` until Crowdin syncs; a missing key falls back to English.
		// Stale keys are still a bug: they survive a rename and never render.
		const enKeys = new Set(Object.keys(flattenLeaves(LOCALES.en)));
		for (const locale of SUPPORTED_LOCALES) {
			if (locale === 'en') continue;
			const orphans = Object.keys(flattenLeaves(LOCALES[locale])).filter((key) => !enKeys.has(key));
			expect(orphans.sort(), `keys in ${locale} missing from en.json`).toEqual([]);
		}
	});

	it('only references catalogue keys that exist in English', () => {
		const referenced = collectReferencedKeys();
		expect(referenced.size).toBeGreaterThan(0);

		const missing: string[] = [];
		for (const [key, files] of referenced) {
			if (typeof lookupKey(LOCALES.en, key) !== 'string') {
				missing.push(`${key} (${[...files].sort().join(', ')})`);
			}
		}
		expect(missing, 'keys used in source but missing from en.json').toEqual([]);
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
		expect(formatMessage('en', 'common.days', { count: 1 })).toBe('1 day');
		expect(formatMessage('en', 'common.days', { count: 5 })).toBe('5 days');
		expect(formatMessage('en', 'common.days', { count: 0 })).toBe('0 days');
		expect(formatMessage('en', 'common.activeDays', { count: 1 })).toBe('1 active day');
		expect(formatMessage('en', 'common.activeDays', { count: 4 })).toBe('4 active days');

		// Target catalogues may lag English; a missing key falls back to the English string,
		// and Crowdin's pre-translate workflow fills the translations after merge.
		expect(formatMessage('fr', 'common.days', { count: 2 })).toBe('2 days');
	});

	it('falls back to English when a key is missing in another locale', () => {
		// `common.since` exists in English but is not yet in the German catalogue.
		expect(formatMessage('en', 'common.since')).toBe('since');
		expect(formatMessage('de', 'common.since')).toBe('since');
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
	it('handles plural exact matches and numbers gracefully', () => {
		expect(formatMessage('en', 'common.days', { count: 1 })).toBe('1 day');
		expect(formatMessage('en', 'common.days', { count: 12 })).toBe('12 days');
		// Target catalogues may lag English; a missing key falls back to the English string.
		expect(formatMessage('de', 'common.days', { count: 5 })).toBe('5 days');
	});
});
