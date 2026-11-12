import { getContext, setContext } from 'svelte';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './types';
import { formatMessage, type MessageKey, type MessageParams } from './format';

const I18N_CONTEXT_KEY = Symbol('crag-stats-i18n');

export type I18nContext = {
	readonly locale: SupportedLocale;
	setLocale: (next: SupportedLocale) => void;
	syncLocale: (next: SupportedLocale, options?: { persistCookie?: boolean }) => void;
	t: (key: MessageKey, params?: MessageParams) => string;
};

function applyDocumentLocale(next: SupportedLocale, persistCookie: boolean) {
	if (typeof document === 'undefined') return;
	document.documentElement.lang = next;
	if (persistCookie) {
		document.cookie = `cs_locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
	}
}

export function initI18n(
	initial: SupportedLocale | (() => SupportedLocale) = DEFAULT_LOCALE
): I18nContext {
	const resolveInitial = () => {
		const val = typeof initial === 'function' ? initial() : initial;
		return isSupportedLocale(val) ? val : DEFAULT_LOCALE;
	};

	let current = $state<SupportedLocale>(resolveInitial());

	const ctx: I18nContext = {
		get locale() {
			return current;
		},
		setLocale(next: SupportedLocale) {
			if (!isSupportedLocale(next)) return;
			current = next;
			applyDocumentLocale(next, true);
		},
		syncLocale(next: SupportedLocale, options?: { persistCookie?: boolean }) {
			if (!isSupportedLocale(next)) return;
			current = next;
			applyDocumentLocale(next, Boolean(options?.persistCookie));
		},
		t(key: MessageKey, params?: MessageParams) {
			return formatMessage(current, key, params);
		}
	};

	setContext(I18N_CONTEXT_KEY, ctx);
	return ctx;
}

export function useI18n(): I18nContext {
	try {
		const ctx = getContext<I18nContext | undefined>(I18N_CONTEXT_KEY);
		if (ctx) return ctx;
	} catch {
		// Outside Svelte component tree
	}
	return {
		locale: DEFAULT_LOCALE,
		setLocale: () => {},
		syncLocale: () => {},
		t: (key: MessageKey, params?: MessageParams) => formatMessage(DEFAULT_LOCALE, key, params)
	};
}

/**
 * Convenience translation helper.
 * If `locale` is passed, formats for that locale.
 * Otherwise uses active context from `useI18n()`.
 */
export function t(key: MessageKey, params?: MessageParams, locale?: SupportedLocale): string {
	if (locale && isSupportedLocale(locale)) {
		return formatMessage(locale, key, params);
	}
	return useI18n().t(key, params);
}
