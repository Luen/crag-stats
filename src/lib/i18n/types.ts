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

/** Match BCP 47 language tag (e.g. 'de-DE' or 'fr_FR' -> 'de' or 'fr'). */
export function normalizeLocale(tag: string | null | undefined): SupportedLocale {
	if (!tag) return DEFAULT_LOCALE;
	const clean = tag.trim().toLowerCase().replace('_', '-');
	const primary = clean.split('-')[0];
	if (isSupportedLocale(primary)) return primary;
	return DEFAULT_LOCALE;
}
