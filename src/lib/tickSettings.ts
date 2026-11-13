export type TickBehavior = 'enable' | 'hide' | 'projects_goals';

export type TickTypeSettings = Record<string, TickBehavior>;

export type TickCategory = 'send' | 'attempt' | 'solo' | 'other';

export type AvailableTickType = {
	key: string;
	name: string;
	category: TickCategory;
	isSend: boolean;
	count?: number;
};

export type TickPreset = 'all' | 'sends_only' | 'exclude_working';

export const STANDARD_TICKS: readonly AvailableTickType[] = [
	// Clean sends
	{ key: 'onsight', name: 'Onsight', category: 'send', isSend: true },
	{ key: 'flash', name: 'Flash', category: 'send', isSend: true },
	{ key: 'red point', name: 'Red point', category: 'send', isSend: true },
	{ key: 'pink point', name: 'Pink point', category: 'send', isSend: true },
	{ key: 'send', name: 'Send', category: 'send', isSend: true },
	{ key: 'clean', name: 'Clean', category: 'send', isSend: true },
	{ key: 'repeat', name: 'Repeat', category: 'send', isSend: true },
	{ key: 'top rope', name: 'Top rope', category: 'send', isSend: true },
	{ key: 'lead', name: 'Lead', category: 'send', isSend: true },
	{ key: 'green point', name: 'Green point', category: 'send', isSend: true },
	{ key: 'ground up red point', name: 'Ground up red point', category: 'send', isSend: true },
	{ key: 'all free with rest', name: 'All free with rest', category: 'send', isSend: true },
	{ key: 'tick', name: 'Tick', category: 'send', isSend: true },

	// Solo ascents
	{ key: 'free solo', name: 'Free solo', category: 'solo', isSend: true },
	{ key: 'solo', name: 'Solo', category: 'solo', isSend: true },
	{ key: 'roped solo', name: 'Roped solo', category: 'solo', isSend: true },
	{ key: 'lead solo', name: 'Lead solo', category: 'solo', isSend: true },
	{ key: 'aid solo', name: 'Aid solo', category: 'solo', isSend: true },

	// Attempts & projecting
	{ key: 'working', name: 'Working', category: 'attempt', isSend: false },
	{ key: 'attempt', name: 'Attempt', category: 'attempt', isSend: false },
	{ key: 'hang dog', name: 'Hang dog', category: 'attempt', isSend: false },
	{ key: 'retreat', name: 'Retreat', category: 'attempt', isSend: false },
	{ key: 'dab', name: 'Dab', category: 'attempt', isSend: false },
	{ key: 'hit', name: 'Hit', category: 'attempt', isSend: false },
	{ key: 'target', name: 'Target', category: 'attempt', isSend: false },
	{ key: 'mark', name: 'Mark', category: 'attempt', isSend: false }
];

/** Normalize tick name or label to standard lowercase key with canonical spacing. */
export function canonicalTickKey(tick: string | null | undefined): string {
	const k = (tick || '').trim().toLowerCase().replace(/\s+/g, ' ');
	if (!k) return '';
	if (k === 'hangdog') return 'hang dog';
	if (k === 'redpoint') return 'red point';
	if (k === 'pinkpoint') return 'pink point';
	if (k === 'toprope' || k === 'tr') return 'top rope';
	if (k === 'leadsolo' || k === 'lead-solo') return 'lead solo';
	if (k === 'ropedsolo' || k === 'roped_solo' || k === 'top-rope solo') return 'roped solo';
	if (k === 'aidsolo') return 'aid solo';
	if (k === 'freesolo' || k === 'free-solo') return 'free solo';
	return k;
}

export function parseTickTypeSettings(raw: string | null | undefined): TickTypeSettings {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		const out: TickTypeSettings = {};
		for (const [key, val] of Object.entries(parsed)) {
			const canon = canonicalTickKey(key);
			if (!canon) continue;
			if (val === 'hide' || val === 'projects_goals' || val === 'enable') {
				if (val !== 'enable') {
					out[canon] = val;
				}
			}
		}
		return out;
	} catch {
		return {};
	}
}

export function serializeTickTypeSettings(settings: TickTypeSettings): string {
	const out: TickTypeSettings = {};
	for (const [key, val] of Object.entries(settings)) {
		const canon = canonicalTickKey(key);
		if (!canon) continue;
		if (val === 'hide' || val === 'projects_goals') {
			out[canon] = val;
		}
	}
	// Stable key order, so an unchanged configuration always serializes identically.
	const sorted = Object.keys(out)
		.sort((a, b) => a.localeCompare(b))
		.map((key) => [key, out[key]] as const);
	return JSON.stringify(Object.fromEntries(sorted));
}

/** True when both configurations would store the same tick behaviour. */
export function sameTickTypeSettings(a: TickTypeSettings, b: TickTypeSettings): boolean {
	return serializeTickTypeSettings(a) === serializeTickTypeSettings(b);
}

export function getTickBehavior(
	tick: string | null | undefined,
	settings?: TickTypeSettings | null
): TickBehavior {
	if (!settings) return 'enable';
	const canon = canonicalTickKey(tick);
	if (!canon) return 'enable';
	return settings[canon] ?? settings[(tick || '').trim().toLowerCase()] ?? 'enable';
}

export function isTickCountedInAnalytics(
	tick: string | null | undefined,
	settings?: TickTypeSettings | null
): boolean {
	return getTickBehavior(tick, settings) === 'enable';
}

export function isTickCountedInProjectsAndGoals(
	tick: string | null | undefined,
	settings?: TickTypeSettings | null
): boolean {
	return getTickBehavior(tick, settings) !== 'hide';
}

export function presetSettings(
	preset: TickPreset,
	available: readonly AvailableTickType[] = STANDARD_TICKS
): TickTypeSettings {
	if (preset === 'all') {
		return {};
	}
	if (preset === 'sends_only') {
		const out: TickTypeSettings = {};
		for (const item of available) {
			if (!item.isSend) {
				out[item.key] = 'projects_goals';
			}
		}
		return out;
	}
	if (preset === 'exclude_working') {
		return { working: 'projects_goals' };
	}
	return {};
}

/**
 * Complete behaviour map for every available tick (explicit `enable` included).
 * Presets must override stored choices rather than merge under them, so picking
 * "All logged ticks" really clears earlier hides.
 */
export function presetTickState(
	preset: TickPreset,
	available: readonly AvailableTickType[] = STANDARD_TICKS
): TickTypeSettings {
	const presetMap = presetSettings(preset, available);
	const out: TickTypeSettings = {};
	for (const item of available) {
		out[item.key] = presetMap[item.key] ?? 'enable';
	}
	return out;
}

/**
 * Preset state over the settings page's current state, including stored choices for
 * ticks that are not rendered right now (no logged rows or an unknown provider name).
 * Only the `all` preset can clear those — the other presets only describe the rendered
 * matrix, and merging under them keeps the earlier, stricter choices.
 */
export function applyPresetToState(
	preset: TickPreset,
	current: TickTypeSettings,
	available: readonly AvailableTickType[] = STANDARD_TICKS
): TickTypeSettings {
	const out = presetTickState(preset, available);
	if (preset === 'all') {
		for (const key of Object.keys(current)) {
			if (!(key in out)) out[key] = 'enable';
		}
	}
	return out;
}

export function detectCurrentPreset(
	settings: TickTypeSettings,
	available: readonly AvailableTickType[] = STANDARD_TICKS
): TickPreset | 'custom' {
	const activeKeys = Object.entries(settings)
		.filter(([, val]) => val !== 'enable')
		.map(([key]) => key);

	if (activeKeys.length === 0) {
		return 'all';
	}
	if (activeKeys.length === 1 && settings['working'] === 'projects_goals') {
		return 'exclude_working';
	}

	const attemptKeys = available.filter((t) => !t.isSend).map((t) => t.key);
	const allAttemptsMatch =
		attemptKeys.length > 0 &&
		attemptKeys.every((k) => settings[k] === 'projects_goals') &&
		activeKeys.every((k) => attemptKeys.includes(k) && settings[k] === 'projects_goals');

	if (allAttemptsMatch) {
		return 'sends_only';
	}

	return 'custom';
}

const CATEGORY_ORDER: Record<TickCategory, { order: number; label: string }> = {
	send: { order: 1, label: 'Clean sends' },
	solo: { order: 2, label: 'Solo ascents' },
	attempt: { order: 3, label: 'Attempts & projecting' },
	other: { order: 4, label: 'Other logged ticks' }
};

export function groupTicksByCategory(ticks: readonly AvailableTickType[]): {
	name: string;
	category: TickCategory;
	ticks: AvailableTickType[];
}[] {
	const groups = new Map<TickCategory, AvailableTickType[]>();
	for (const tick of ticks) {
		const list = groups.get(tick.category);
		if (list) list.push(tick);
		else groups.set(tick.category, [tick]);
	}

	return [...groups.entries()]
		.sort(([catA], [catB]) => CATEGORY_ORDER[catA].order - CATEGORY_ORDER[catB].order)
		.map(([category, items]) => ({
			name: CATEGORY_ORDER[category].label,
			category,
			ticks: items
		}));
}
