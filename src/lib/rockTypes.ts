/** Curated climbing-oriented notes for theCrag “Rock type” tags. */
export type RockTypeInfo = {
	name: string;
	summary: string;
	tips: string;
};

const ROCK_TYPES: Record<string, RockTypeInfo> = {
	granite: {
		name: 'Granite',
		summary:
			'Hard igneous rock with quartz and feldspar — famous for friction slabs, crystals, and splitter cracks (think Yosemite-style).',
		tips: 'Often condition-dependent: grippy when cool, slicker when hot. Sharp crystals can be hard on skin.'
	},
	sandstone: {
		name: 'Sandstone',
		summary:
			'Sedimentary rock of cemented sand grains — rough friction, pockets, and dramatic desert features.',
		tips: 'Avoid climbing when wet: soft sandstone can break holds. Let it dry thoroughly after rain.'
	},
	limestone: {
		name: 'Limestone',
		summary:
			'Calcium-carbonate rock that forms pockets, tufas, caves, and steep sport walls common in Europe.',
		tips: 'Popular routes polish easily. Cracks are less common than on granite, so many crags are bolted.'
	},
	gritstone: {
		name: 'Gritstone',
		summary:
			'Coarse, hard sandstone (UK Peak District classic) with outstanding friction on rounded breaks and arêtes.',
		tips: 'Trad ethic is strong; fragile when wet — stay off after rain.'
	},
	volcanic: {
		name: 'Volcanic',
		summary:
			'Basalt and related volcanics — often solid with positive edges, columns, or blocky features.',
		tips: 'Quality varies by flow; some areas are bombproof, others loose on the edges.'
	},
	basalt: {
		name: 'Basalt',
		summary: 'Fine-grained volcanic rock, often forming columns, faces, and solid cracks.',
		tips: 'Usually sounder when wet than sandstone, but check local loose blocks.'
	},
	quartzite: {
		name: 'Quartzite',
		summary: 'Metamorphosed sandstone — very hard, often sharp and friction-rich.',
		tips: 'Can be abrasive on skin and shoes; holds tend to be positive when featured.'
	},
	conglomerate: {
		name: 'Conglomerate',
		summary: 'Pebbles cemented in a matrix — climbing on glued-in cobbles and weird features.',
		tips: 'Trust holds carefully; matrix quality varies wildly between crags.'
	},
	dolomite: {
		name: 'Dolomite',
		summary: 'Carbonate rock related to limestone, often forming steep alpine walls and towers.',
		tips: 'Can be polished or friable depending on the formation — treat like limestone for wet conditions.'
	},
	slate: {
		name: 'Slate',
		summary: 'Fine metamorphic rock with smooth, often technical faces and small edges.',
		tips: 'Friction can feel glassy; careful footwork matters more than raw strength.'
	},
	gneiss: {
		name: 'Gneiss',
		summary: 'Banded metamorphic rock with mixed crystal textures and solid alpine faces.',
		tips: 'Quality varies by banding; often similar feel to granite with more variety in holds.'
	},
	choss: {
		name: 'Choss',
		summary: 'Loose, poorly cemented rock — adventure climbing more than textbook geology.',
		tips: 'Helmets, careful testing of holds, and ground-up caution are the game.'
	}
};

export function rockTypeInfo(name: string | null | undefined): RockTypeInfo | null {
	if (!name) return null;
	const key = name.trim().toLowerCase();
	if (ROCK_TYPES[key]) return ROCK_TYPES[key];
	for (const [k, info] of Object.entries(ROCK_TYPES)) {
		if (key.includes(k) || k.includes(key)) return info;
	}
	return {
		name: name.trim(),
		summary: `Tagged as ${name.trim()} on theCrag — rock character varies by area.`,
		tips: 'Check local topos and ethics; conditions (especially wet rock) matter for softer rock types.'
	};
}

export function rockTypeBlurb(dominant: string | null, pct: number | null): string | null {
	if (!dominant) return null;
	const info = rockTypeInfo(dominant);
	if (!info) return null;
	const share =
		pct != null && Number.isFinite(pct) ? ` (${Math.round(pct)}% of tagged ascents)` : '';
	return `I climb mostly on ${info.name}${share}. ${info.summary} ${info.tips}`;
}
