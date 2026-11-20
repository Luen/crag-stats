export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Locales the UI actually offers.
 *
 * A locale is *supported* once its catalogue exists and is validated by `i18n.test.ts`; it is
 * *enabled* once that catalogue is translated well enough to ship. Catalogues for the rest stay
 * compiled (and stay validated against English for orphan keys), and Crowdin keeps translating
 * them, so enabling one later only requires updating this list.
 *
 * English, German, French, and Spanish are enabled. Missing translations fall back to English
 * while Crowdin completes the remaining French copy (see docs/dev/TRANSLATIONS.md).
 */
export const ENABLED_LOCALES = [
	'en',
	'de',
	'fr',
	'es'
] as const satisfies readonly SupportedLocale[];
export type EnabledLocale = (typeof ENABLED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export type LocaleMetadata = {
	code: SupportedLocale;
	name: string;
	nativeName: string;
	flag: string;
};

export const LOCALE_METADATA: Record<SupportedLocale, LocaleMetadata> = {
	en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
	de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
	fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
	es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
	it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' }
};

export function isSupportedLocale(value: unknown): value is SupportedLocale {
	return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

/** True for a locale the UI offers today. Disabled locales resolve to `DEFAULT_LOCALE`. */
export function isEnabledLocale(value: unknown): value is EnabledLocale {
	return typeof value === 'string' && (ENABLED_LOCALES as readonly string[]).includes(value);
}

/**
 * Match a BCP 47 language tag (e.g. 'de-DE', 'fr_FR', or 'de;q=0.9') to one of `allowed`
 * (every supported locale by default), or return null when the tag matches none of them.
 */
export function matchSupportedLocale(
	tag: string | null | undefined,
	allowed: readonly SupportedLocale[] = SUPPORTED_LOCALES
): SupportedLocale | null {
	if (!tag) return null;
	const withoutParams = tag.split(';')[0] ?? '';
	const clean = withoutParams.trim().toLowerCase().replace('_', '-');
	if (!clean) return null;
	const primary = clean.split('-')[0];
	const candidate = SUPPORTED_LOCALES.find((locale) => locale === primary);
	return candidate && allowed.includes(candidate) ? candidate : null;
}

/** Match BCP 47 language tag (e.g. 'de-DE' or 'fr_FR' -> 'de' or 'fr'), falling back to DEFAULT_LOCALE. */
export function normalizeLocale(tag: string | null | undefined): SupportedLocale {
	return matchSupportedLocale(tag) ?? DEFAULT_LOCALE;
}

/**
 * BCP 47 tag for `Intl` number/date formatting. The `en` catalogue is Australian English, so
 * English keeps the `en-AU` conventions the app always used instead of `en-US`.
 */
export function intlLocale(locale: SupportedLocale): string {
	return locale === 'en' ? 'en-AU' : locale;
}

/**
 * Match an HTTP Accept-Language header (e.g. 'nl-NL, de-DE;q=0.9, en;q=0.8')
 * to the highest-priority locale in `allowed` (every supported locale by default), or return null
 * if none match.
 */
export function matchAcceptLanguage(
	header: string | null | undefined,
	allowed: readonly SupportedLocale[] = SUPPORTED_LOCALES
): SupportedLocale | null {
	if (!header) return null;
	const candidates = header
		.split(',')
		.map((part, index) => {
			const [tagPart, ...params] = part.trim().split(';');
			let q = 1;
			for (const param of params) {
				const [k, v] = param.trim().split('=');
				if (k?.toLowerCase() === 'q' && v !== undefined) {
					const parsed = Number(v);
					if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
						q = parsed;
					} else {
						q = 0;
					}
				}
			}
			return { tag: tagPart ?? '', q, index };
		})
		.filter((c) => c.q > 0 && c.tag.length > 0)
		.sort((a, b) => b.q - a.q || a.index - b.index);

	for (const candidate of candidates) {
		const matched = matchSupportedLocale(candidate.tag, allowed);
		if (matched) return matched;
	}
	return null;
}

export type ResolveLocaleInput = {
	query?: string | null;
	cookie?: string | null;
	stored?: string | null;
	displayLocale?: string | null;
	acceptLanguage?: string | null;
};

/**
 * Resolve active locale using the priority order:
 *
 * 1. `?locale=` query param (explicit link override; the layout remembers it in the cookie)
 * 2. `cs_locale` cookie (visitor preference)
 * 3. `app_settings.locale` (stored DB default when explicitly chosen by admin)
 * 4. Accept-Language HTTP header (browser autodetection when stored is unset or auto)
 * 5. DISPLAY_LOCALE environment variable (fallback if browser language is unsupported)
 * 6. DEFAULT_LOCALE ('en')
 *
 * Only `ENABLED_LOCALES` are ever returned: a stale `cs_locale=it` cookie, an old
 * `app_settings.locale` row, or an Italian browser header all fall through to the next source rather
 * than serving a catalogue that is still being translated.
 */
export function resolveLocale(input: ResolveLocaleInput): SupportedLocale {
	return (
		matchSupportedLocale(input.query, ENABLED_LOCALES) ??
		matchSupportedLocale(input.cookie, ENABLED_LOCALES) ??
		matchSupportedLocale(input.stored, ENABLED_LOCALES) ??
		matchAcceptLanguage(input.acceptLanguage, ENABLED_LOCALES) ??
		matchSupportedLocale(input.displayLocale, ENABLED_LOCALES) ??
		DEFAULT_LOCALE
	);
}
