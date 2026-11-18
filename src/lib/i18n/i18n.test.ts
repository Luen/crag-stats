import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_LOCALE,
	ENABLED_LOCALES,
	LOCALE_METADATA,
	SUPPORTED_LOCALES,
	isEnabledLocale,
	isSupportedLocale,
	matchAcceptLanguage,
	matchSupportedLocale,
	normalizeLocale,
	resolveLocale
} from './types';
import { formatMessage, LOCALES } from './format';
import { parseRichText } from '../richText';
import { DEFAULT_DASH_CARDS } from '../dashboardLayout';
import { DATE_FORMAT_OPTIONS } from '../dates';
import { eddingtonTiles } from '../eddingtonDisplay';
import {
	BOULDER_GRADE_SYSTEMS,
	ROUTE_GRADE_SYSTEMS,
	describeDisplaySystems
} from '../grades/format';
import { ascentPartners, partnerMetricLabel } from '../partnerStats';
import { rockTypeBlurb, rockTypeInfo } from '../rockTypes';
import { REPEAT_PERSONA_LABELS, REPEAT_PERSONA_LABEL_KEYS } from '../routeRepeats';
import {
	DISTANCE_UNIT_OPTIONS,
	HEIGHT_UNIT_OPTIONS,
	PRECIPITATION_UNIT_OPTIONS,
	TEMPERATURE_UNIT_OPTIONS,
	UNIT_PRESETS,
	WIND_UNIT_OPTIONS
} from '../units';
import {
	WEEKDAY_FULL,
	WEEKDAY_FULL_KEYS,
	WEEKDAY_LABELS,
	WEEKDAY_LABEL_KEYS,
	WEEKDAY_ORDER
} from '../weekdayStats';
import { BADGE_CATALOG, buildBadges } from '../server/badges';
import { kindLabel } from '../server/goalsShared';

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

	it('enables a subset of the supported locales while the rest are still translating', () => {
		// A catalogue can exist and be validated without being offered: Half-translated copy reads
		// worse than English, so languages ship one at a time (docs/dev/TRANSLATIONS.md).
		expect(ENABLED_LOCALES).toEqual(['en', 'de']);
		for (const locale of ENABLED_LOCALES) {
			expect(SUPPORTED_LOCALES).toContain(locale);
			expect(isEnabledLocale(locale)).toBe(true);
			expect(isSupportedLocale(locale)).toBe(true);
		}
		expect(isEnabledLocale('fr')).toBe(false);
		expect(isSupportedLocale('fr')).toBe(true);
		expect(isEnabledLocale(null)).toBe(false);
	});

	it('never resolves to a locale that is not enabled', () => {
		// A stale cs_locale=fr cookie, an old app_settings row, or a French browser header all
		// fall through to the next source instead of serving a half-translated catalogue.
		expect(resolveLocale({ query: 'fr' })).toBe('en');
		expect(resolveLocale({ cookie: 'es' })).toBe('en');
		expect(resolveLocale({ stored: 'it' })).toBe('en');
		expect(resolveLocale({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en');
		expect(resolveLocale({ displayLocale: 'es-AR' })).toBe('en');
		// An enabled locale still wins, and a disabled query does not shadow a lower-priority one.
		expect(resolveLocale({ query: 'de' })).toBe('de');
		expect(resolveLocale({ query: 'fr', stored: 'de' })).toBe('de');
		expect(resolveLocale({ acceptLanguage: 'fr;q=0.9, de;q=0.8' })).toBe('de');
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
		// Enabled locales only: `de` is the one translated target, so the ordering is proved with
		// it against English rather than with a catalogue that is still being translated.
		// 1. Query wins over cookie and stored
		expect(
			resolveLocale({
				query: 'de',
				cookie: 'en',
				stored: 'en',
				displayLocale: 'en-GB',
				acceptLanguage: 'en-US'
			})
		).toBe('de');

		// 2. Cookie wins over stored
		expect(
			resolveLocale({
				query: null,
				cookie: 'en',
				stored: 'de',
				displayLocale: 'en-GB',
				acceptLanguage: 'de-DE'
			})
		).toBe('en');

		// 3. Explicit stored 'de' wins over Accept-Language when query and cookie are unset
		expect(
			resolveLocale({
				query: null,
				cookie: null,
				stored: 'de',
				displayLocale: 'en-GB',
				acceptLanguage: 'en-AU'
			})
		).toBe('de');

		// 4. Accept-Language autodetects when stored is unset or auto
		expect(
			resolveLocale({
				query: null,
				cookie: null,
				stored: null,
				displayLocale: 'en-GB',
				acceptLanguage: 'de-AT,de;q=0.9'
			})
		).toBe('de');

		// 5. displayLocale wins when Accept-Language is unsupported
		expect(
			resolveLocale({
				query: 'invalid',
				cookie: undefined,
				stored: '',
				displayLocale: 'de-CH',
				acceptLanguage: 'zh-CN, ja;q=0.9'
			})
		).toBe('de');

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
		expect(formatMessage('it', 'nav.logbook')).toBe('Diario');
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

		expect(formatMessage('fr', 'common.days', { count: 2 })).toContain('2');
	});

	it('formats the plural count with locale number grouping', () => {
		// ICU's `#` is the count formatted for the active locale (#492), regardless of wording.
		expect(formatMessage('en', 'common.days', { count: 12345 })).toBe('12,345 days');
		expect(formatMessage('de', 'common.days', { count: 12345 })).toContain('12.345');
		// Spanish and Italian only group from five digits up, per CLDR minimumGroupingDigits.
		expect(formatMessage('es', 'common.days', { count: 12345 })).toContain('12.345');
		expect(formatMessage('it', 'common.days', { count: 12345 })).toContain('12.345');
		expect(formatMessage('en', 'common.activeDays', { count: 1234 })).toBe('1,234 active days');
	});

	it('falls back to English when a key is missing in another locale', () => {
		LOCALES.en['test.fallback'] = 'Fallback wording';
		try {
			expect(formatMessage('de', 'test.fallback')).toBe('Fallback wording');
			LOCALES.de['test.fallback'] = '';
			expect(formatMessage('de', 'test.fallback')).toBe('Fallback wording');
			LOCALES.de['test.fallback'] = '   ';
			expect(formatMessage('de', 'test.fallback')).toBe('Fallback wording');
		} finally {
			delete LOCALES.en['test.fallback'];
			delete LOCALES.de['test.fallback'];
		}
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
		expect(formatMessage('es', 'ticks.send')).toBe('Encadenado');
		expect(formatMessage('es', 'ticks.toprope')).toBe('En polea');
		expect(formatMessage('it', 'ticks.send')).toBe('Chiuso');
		expect(formatMessage('it', 'styles.sport')).toBe('Sportiva');
	});

	it('translates grade bands with a distinct name per level in every locale', () => {
		const order = ['beginner', 'intermediate', 'experienced', 'expert', 'elite'];
		for (const locale of ['en', 'de', 'fr', 'es', 'it'] as const) {
			const names = order.map((band) => formatMessage(locale, `grades.bands.${band}`));
			expect(new Set(names).size, `${locale} repeats a band name: ${names.join(' / ')}`).toBe(
				names.length
			);
		}
		// Italian previously labelled Experienced "Esperto" and Expert "Avanzato", which reads
		// backwards: the harder band must not sound milder than the one below it (#493).
		expect(formatMessage('it', 'grades.bands.experienced')).toBe('Avanzato');
		expect(formatMessage('it', 'grades.bands.expert')).toBe('Esperto');
	});

	it('leaves no unbalanced inline markup in any English sentence', () => {
		const walk = (nodes: ReturnType<typeof parseRichText>, key: string) => {
			for (const node of nodes) {
				if (node.kind === 'text') {
					// An unmatched `**` or backtick survives as text and would show up in the UI.
					expect(node.text, key).not.toMatch(/\*\*|`/);
				} else {
					walk(node.children, key);
				}
			}
		};
		for (const [key, text] of Object.entries(flattenLeaves(LOCALES.en))) {
			walk(parseRichText(text), key);
		}
	});
});

describe('i18n context and reactivity', () => {
	it('preserves interpolation and plural variables in downloaded translations', () => {
		const variables = (text: string) =>
			[
				...new Set(
					[
						...text
							.replace(
								/(\{\w+,\s*plural,\s*|\}\s*)(?:zero|one|two|few|many|other|=\d+)\s*\{/g,
								'$1'
							)
							.matchAll(/\{(\w+)(?:\}|,\s*plural,)/g)
					].map((m) => m[1])
				)
			].sort();
		expect(variables('{count, plural, one {year} other {years}}')).toEqual(['count']);
		expect(variables('at least one {style} ascent')).toEqual(['style']);
		const source = flattenLeaves(LOCALES.en);
		for (const locale of SUPPORTED_LOCALES.filter((l) => l !== 'en')) {
			for (const [key, text] of Object.entries(flattenLeaves(LOCALES[locale]))) {
				if (!text.trim()) continue; // Untranslated Crowdin entries use English fallback.
				expect(variables(text), `${locale}: ${key}`).toEqual(variables(source[key] ?? ''));
				if (!source[key]?.includes('#')) expect(text, `${locale}: ${key}`).not.toContain('#');
			}
		}
	});

	it('handles plural exact matches and numbers gracefully', () => {
		expect(formatMessage('en', 'common.days', { count: 1 })).toBe('1 day');
		expect(formatMessage('en', 'common.days', { count: 12 })).toBe('12 days');
		// Exercise fallback independently of how far the real target catalogue has progressed.
		LOCALES.en['test.fallbackDays'] = '{count, plural, one {# day} other {# days}}';
		try {
			expect(formatMessage('de', 'test.fallbackDays', { count: 5 })).toBe('5 days');
		} finally {
			delete LOCALES.en['test.fallbackDays'];
		}
	});
});

describe('module-level copy and label tables (#495)', () => {
	it('derives all .ts option and label tables from en.json', () => {
		for (const card of DEFAULT_DASH_CARDS) {
			expect(card.label).toBe(formatMessage('en', card.labelKey));
		}
		for (const preset of UNIT_PRESETS) {
			expect(preset.label).toBe(formatMessage('en', preset.labelKey));
			expect(preset.description).toBe(formatMessage('en', preset.descriptionKey));
		}
		for (const opt of [
			...HEIGHT_UNIT_OPTIONS,
			...DISTANCE_UNIT_OPTIONS,
			...TEMPERATURE_UNIT_OPTIONS,
			...WIND_UNIT_OPTIONS,
			...PRECIPITATION_UNIT_OPTIONS,
			...ROUTE_GRADE_SYSTEMS,
			...BOULDER_GRADE_SYSTEMS
		]) {
			expect(opt.label).toBe(formatMessage('en', opt.labelKey));
		}
		for (const opt of DATE_FORMAT_OPTIONS) {
			expect(opt.label).toBe(formatMessage('en', opt.labelKey));
			expect(opt.hint).toBe(formatMessage('en', opt.hintKey));
		}
		for (const day of WEEKDAY_ORDER) {
			expect(WEEKDAY_LABELS[day]).toBe(formatMessage('en', WEEKDAY_LABEL_KEYS[day]));
			expect(WEEKDAY_FULL[day]).toBe(formatMessage('en', WEEKDAY_FULL_KEYS[day]));
		}
		for (const persona of ['explorer', 'repeater', 'mixed'] as const) {
			expect(REPEAT_PERSONA_LABELS[persona]).toBe(
				formatMessage('en', REPEAT_PERSONA_LABEL_KEYS[persona])
			);
		}
		for (const badge of BADGE_CATALOG) {
			expect(badge.title).not.toMatch(/^cards\.badges\./);
			expect(badge.hint).not.toMatch(/^cards\.badges\./);
		}
	});

	it('formats builder and helper strings with the active SupportedLocale', () => {
		expect(describeDisplaySystems({ route: 'french', boulder: 'font' }, 'en')).toBe(
			'French routes, Fontainebleau (Font) boulders'
		);

		const deBadges = buildBadges([], [], [], { locale: 'de' });
		expect(deBadges.locked.find((b) => b.id === 'band_intermediate')?.title).toBe(
			'Fortgeschritten'
		);

		const sampleEdd = {
			sends: { value: 12, next: 13, needed: 1 },
			vertical: { value: 3, next: 4, needed: 1 },
			routeGrade: { value: 20, next: 21, needed: 1 },
			boulderGrade: { value: 4, next: 5, needed: 2 },
			verticalUnitM: 100,
			activeDays: 12
		};
		const edd = eddingtonTiles(sampleEdd, 'en');
		expect(edd[0]?.label).toBe('Send days');
		expect(edd[0]?.means).toBe('12 days with 12+ sends');
		expect(edd[0]?.next).toBe('1 more day of 13+ sends for 13');

		const eddDe = eddingtonTiles(
			{
				...sampleEdd,
				sends: { value: 1234, next: 1235, needed: 1 }
			},
			'de'
		);
		expect(eddDe[0]?.means).toContain('1.234');

		expect(rockTypeInfo('granite', 'en')?.name).toBe('Granite');
		expect(rockTypeBlurb('granite', 64, 'en')).toContain(
			'I climb mostly on Granite (64% of tagged ascents).'
		);

		expect(kindLabel('height_year', 'en')).toBe('Height climbed this year');
		expect(ascentPartners('@alice, @bob', 'en')).toBe('Partners on this ascent: alice, bob');
		expect(partnerMetricLabel('sessions', 1, 'en')).toBe('session');
		expect(partnerMetricLabel('sessions', 3, 'en')).toBe('sessions');
	});
});
