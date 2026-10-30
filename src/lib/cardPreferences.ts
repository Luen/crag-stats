/** Whitelisted browser display preferences shared by SSR and interactive cards. */
const VALUES = {
	cs_partners_metric: ['ascents', 'sessions', 'areas'],
	cs_weekday_range: ['all', 'last12'],
	cs_weekday_metric: ['sessions', 'ascents'],
	cs_weekday_style: ['all', 'sport', 'trad', 'boulder'],
	cs_yearly_chart: ['year', 'cumulative'],
	cs_heatmap_mode: ['intensity', 'grade', 'weather']
} as const;
export type CardPreferenceKey = keyof typeof VALUES;
/** Keep in sync with the pre-paint migration check in src/app.html. */
export const CARD_PREFERENCE_KEYS = Object.keys(VALUES) as CardPreferenceKey[];
export type CardPreferenceValue<K extends CardPreferenceKey> = (typeof VALUES)[K][number];
export type CardPreferences = { [K in CardPreferenceKey]: CardPreferenceValue<K> | null };
export function normalizeCardPreference<K extends CardPreferenceKey>(
	key: K,
	raw: string | null | undefined
): CardPreferenceValue<K> | null {
	const value =
		key === 'cs_yearly_chart' && (raw === 'byYear' || raw === 'career') ? 'cumulative' : raw;
	return value != null && (VALUES[key] as readonly string[]).includes(value)
		? (value as CardPreferenceValue<K>)
		: null;
}
export function readCardPreferences(get: (key: string) => string | undefined): CardPreferences {
	return Object.fromEntries(
		CARD_PREFERENCE_KEYS.map((key) => [key, normalizeCardPreference(key, get(key))])
	) as CardPreferences;
}
export const EMPTY_CARD_PREFERENCES = readCardPreferences(() => undefined);
/** Cookies allow subsequent server renders to use the chosen value before first paint. */
export function saveCardPreference<K extends CardPreferenceKey>(
	key: K,
	value: CardPreferenceValue<K>
): void {
	if (!normalizeCardPreference(key, value)) return;
	try {
		document.cookie = `${key}=${value}; Path=/; SameSite=Lax; Max-Age=31536000${location.protocol === 'https:' ? '; Secure' : ''}`;
	} catch {
		/* blocked cookies */
	}
	try {
		localStorage.setItem(key, value);
	} catch {
		/* blocked storage */
	}
}
/** A valid cookie wins; migrate a legacy localStorage-only preference once on mount. */
export function migrateCardPreference<K extends CardPreferenceKey>(
	key: K,
	serverValue: CardPreferenceValue<K> | null
): CardPreferenceValue<K> {
	let value = serverValue;
	// Read the latest cookie too: layout snapshots may survive client-side navigation.
	try {
		const cookie = document.cookie
			.split('; ')
			.find((v) => v.startsWith(`${key}=`))
			?.slice(key.length + 1);
		value = normalizeCardPreference(key, cookie) ?? value;
	} catch {
		/* blocked cookies */
	}
	if (value == null) {
		try {
			value = normalizeCardPreference(key, localStorage.getItem(key));
		} catch {
			/* blocked storage */
		}
	}
	value ??= VALUES[key][0] as CardPreferenceValue<K>;
	saveCardPreference(key, value);
	return value;
}
