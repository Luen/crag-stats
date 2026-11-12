import { getContext, setContext } from 'svelte';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './types';
import { formatMessage, type MessageKey, type MessageParams } from './format';

const I18N_CONTEXT_KEY = Symbol('crag-stats-i18n');

export type I18nContext = {
	readonly locale: SupportedLocale;
	setLocale: (next: SupportedLocale) => void;
	t: (key: MessageKey, params?: MessageParams) => string;
};

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
			if (!isSupportedLocale(next) || next === current) return;
			current = next;
			if (typeof document !== 'undefined') {
				document.documentElement.lang = next;
				document.cookie = `cs_locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
			}
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
