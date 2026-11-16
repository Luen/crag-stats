import { DEFAULT_LOCALE, formatMessage, type SupportedLocale } from '#lib/i18n';

/** Curated climbing-oriented notes for theCrag “Rock type” tags. */
export type RockTypeInfo = {
	name: string;
	summary: string;
	tips: string;
};

type RockTypeKeys = {
	nameKey: string;
	summaryKey: string;
	tipsKey: string;
};

const ROCK_TYPE_KEYS: Record<string, RockTypeKeys> = {
	granite: {
		nameKey: 'cards.rockTypePanel.graniteName',
		summaryKey: 'cards.rockTypePanel.graniteSummary',
		tipsKey: 'cards.rockTypePanel.graniteTips'
	},
	sandstone: {
		nameKey: 'cards.rockTypePanel.sandstoneName',
		summaryKey: 'cards.rockTypePanel.sandstoneSummary',
		tipsKey: 'cards.rockTypePanel.sandstoneTips'
	},
	limestone: {
		nameKey: 'cards.rockTypePanel.limestoneName',
		summaryKey: 'cards.rockTypePanel.limestoneSummary',
		tipsKey: 'cards.rockTypePanel.limestoneTips'
	},
	gritstone: {
		nameKey: 'cards.rockTypePanel.gritstoneName',
		summaryKey: 'cards.rockTypePanel.gritstoneSummary',
		tipsKey: 'cards.rockTypePanel.gritstoneTips'
	},
	volcanic: {
		nameKey: 'cards.rockTypePanel.volcanicName',
		summaryKey: 'cards.rockTypePanel.volcanicSummary',
		tipsKey: 'cards.rockTypePanel.volcanicTips'
	},
	basalt: {
		nameKey: 'cards.rockTypePanel.basaltName',
		summaryKey: 'cards.rockTypePanel.basaltSummary',
		tipsKey: 'cards.rockTypePanel.basaltTips'
	},
	quartzite: {
		nameKey: 'cards.rockTypePanel.quartziteName',
		summaryKey: 'cards.rockTypePanel.quartziteSummary',
		tipsKey: 'cards.rockTypePanel.quartziteTips'
	},
	conglomerate: {
		nameKey: 'cards.rockTypePanel.conglomerateName',
		summaryKey: 'cards.rockTypePanel.conglomerateSummary',
		tipsKey: 'cards.rockTypePanel.conglomerateTips'
	},
	dolomite: {
		nameKey: 'cards.rockTypePanel.dolomiteName',
		summaryKey: 'cards.rockTypePanel.dolomiteSummary',
		tipsKey: 'cards.rockTypePanel.dolomiteTips'
	},
	slate: {
		nameKey: 'cards.rockTypePanel.slateName',
		summaryKey: 'cards.rockTypePanel.slateSummary',
		tipsKey: 'cards.rockTypePanel.slateTips'
	},
	gneiss: {
		nameKey: 'cards.rockTypePanel.gneissName',
		summaryKey: 'cards.rockTypePanel.gneissSummary',
		tipsKey: 'cards.rockTypePanel.gneissTips'
	},
	choss: {
		nameKey: 'cards.rockTypePanel.chossName',
		summaryKey: 'cards.rockTypePanel.chossSummary',
		tipsKey: 'cards.rockTypePanel.chossTips'
	}
};

function resolveRockInfo(keys: RockTypeKeys, locale: SupportedLocale): RockTypeInfo {
	return {
		name: formatMessage(locale, keys.nameKey),
		summary: formatMessage(locale, keys.summaryKey),
		tips: formatMessage(locale, keys.tipsKey)
	};
}

export function rockTypeInfo(
	name: string | null | undefined,
	locale: SupportedLocale = DEFAULT_LOCALE
): RockTypeInfo | null {
	if (!name) return null;
	const key = name.trim().toLowerCase();
	if (ROCK_TYPE_KEYS[key]) return resolveRockInfo(ROCK_TYPE_KEYS[key], locale);
	for (const [k, keys] of Object.entries(ROCK_TYPE_KEYS)) {
		if (key.includes(k) || k.includes(key)) return resolveRockInfo(keys, locale);
	}
	const trimmed = name.trim();
	return {
		name: trimmed,
		summary: formatMessage(locale, 'cards.rockTypePanel.fallbackSummary', { name: trimmed }),
		tips: formatMessage(locale, 'cards.rockTypePanel.fallbackTips')
	};
}

export function rockTypeBlurb(
	dominant: string | null,
	pct: number | null,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (!dominant) return null;
	const info = rockTypeInfo(dominant, locale);
	if (!info) return null;
	const lead =
		pct != null && Number.isFinite(pct)
			? formatMessage(locale, 'cards.rockTypePanel.blurbWithPct', {
					name: info.name,
					percent: Math.round(pct)
				})
			: formatMessage(locale, 'cards.rockTypePanel.blurbNoPct', { name: info.name });
	return `${lead} ${info.summary} ${info.tips}`;
}
