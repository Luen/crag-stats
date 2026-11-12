export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

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

/**
 * Match a BCP 47 language tag (e.g. 'de-DE', 'fr_FR', or 'de;q=0.9') to a supported locale,
 * or return null when the tag does not match any supported locale.
 */
export function matchSupportedLocale(tag: string | null | undefined): SupportedLocale | null {
	if (!tag) return null;
	const withoutParams = tag.split(';')[0] ?? '';
	const clean = withoutParams.trim().toLowerCase().replace('_', '-');
	if (!clean) return null;
	const primary = clean.split('-')[0];
	if (isSupportedLocale(primary)) return primary;
	return null;
}

/** Match BCP 47 language tag (e.g. 'de-DE' or 'fr_FR' -> 'de' or 'fr'), falling back to DEFAULT_LOCALE. */
export function normalizeLocale(tag: string | null | undefined): SupportedLocale {
	return matchSupportedLocale(tag) ?? DEFAULT_LOCALE;
}

/**
 * Match an HTTP Accept-Language header (e.g. 'nl-NL, de-DE;q=0.9, en;q=0.8')
 * to the highest-priority supported locale, or return null if none match.
 */
export function matchAcceptLanguage(header: string | null | undefined): SupportedLocale | null {
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
		const matched = matchSupportedLocale(candidate.tag);
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
 * 1. ?locale= query param
 * 2. cs_locale cookie
 * 3. app_settings.locale (stored DB setting)
 * 4. DISPLAY_LOCALE environment variable
 * 5. Accept-Language HTTP header
 * 6. DEFAULT_LOCALE ('en')
 */
export function resolveLocale(input: ResolveLocaleInput): SupportedLocale {
	return (
		matchSupportedLocale(input.query) ??
		matchSupportedLocale(input.cookie) ??
		matchSupportedLocale(input.stored) ??
		matchSupportedLocale(input.displayLocale) ??
		matchAcceptLanguage(input.acceptLanguage) ??
		DEFAULT_LOCALE
	);
}
