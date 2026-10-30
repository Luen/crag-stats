import { soloTickKind } from '#lib/soloTicks';
export type ProviderId = 'thecrag' | 'mountainproject' | (string & {});

export type SyncCursor = {
	/** theCrag: max ascent epoch as string */
	since?: string | null;
	page?: number;
};

export type CanonicalRoute = {
	provider: ProviderId;
	externalId: string;
	name: string;
	gradeRaw?: string | null;
	gradeScore?: number | null;
	gradeBand?: number | null;
	gradeSystem?: string | null;
	gearStyle?: string | null;
	heightM?: number | null;
	stars?: number | null;
	url?: string | null;
	country?: string | null;
	cragName?: string | null;
	cragPath?: string | null;
	cragUrl?: string | null;
	areaExternalId?: string | null;
	/** Flattened route tags for chips */
	tags?: { category: string; name: string }[] | null;
	bolts?: number | null;
	parentName?: string | null;
	parentExternalId?: string | null;
	lat?: number | null;
	lon?: number | null;
};

export type CanonicalAscent = {
	provider: ProviderId;
	externalId: string;
	route: CanonicalRoute;
	ascentDate?: string | null;
	logDate?: string | null;
	tickType?: string | null;
	tickLabel?: string | null;
	ascentGearStyle?: string | null;
	ascentGradeRaw?: string | null;
	/** Effective difficulty for this ascent (climbed pitches / CPR), not always full route */
	effectiveGradeRaw?: string | null;
	effectiveGradeScore?: number | null;
	effectiveGradeBand?: number | null;
	pitchLabel?: string | null;
	/** Display label from theCrag when set */
	ascentLabel?: string | null;
	pitchesClimbed?: number | null;
	pitchesTotal?: number | null;
	heightM?: number | null;
	quality?: string | null;
	partners?: string | null;
	comment?: string | null;
	isSend: boolean;
	isAttempt: boolean;
	epoch?: number | null;
	numberAttempts?: number | null;
	cprBase?: string | null;
	cprScore?: number | null;
	cprShiftedScore?: number | null;
	cprShiftedGrade?: string | null;
	cprDecayedScore?: number | null;
	cprDecayedGrade?: string | null;
	/** Direct link to this ascent on theCrag (/ascent/{id}) */
	ascentUrl?: string | null;
	rawJson?: string | null;
};

export type ProviderProfile = {
	provider: ProviderId;
	externalId?: string | null;
	name?: string | null;
	login?: string | null;
	country?: string | null;
	ascentCount?: number | null;
	avatar?: string | null;
	typeOfClimber?: string | null;
	outdoorAscentCount?: number | null;
	indoorAscentCount?: number | null;
	heightClimbed?: number | null;
	routesTicked?: number | null;
	rawJson?: string | null;
};

export type ProviderBatch = {
	profile?: ProviderProfile | null;
	ascents: CanonicalAscent[];
	nextCursor?: SyncCursor | null;
	done: boolean;
};

export type ClimbProvider = {
	id: ProviderId;
	label: string;
	capabilities: {
		apiSync: boolean;
		csvImport: boolean;
		incremental: boolean;
	};
	syncAscents?(cursor: SyncCursor): Promise<ProviderBatch>;
	parseExport?(file: Buffer, format: 'csv' | 'xlsx'): Promise<CanonicalAscent[]>;
};

/** Tick types that count as a successful send (clean ascent). */
export const SEND_TICKS = new Set(
	[
		'onsight',
		'flash',
		'red point',
		'redpoint',
		'pink point',
		'pinkpoint',
		'tick',
		'send',
		'clean',
		'repeat',
		'lead',
		'free solo',
		'solo',
		'roped solo',
		'lead solo',
		'aid solo',
		'all free with rest'
	].map((s) => s.toLowerCase())
);

export const ATTEMPT_TICKS = new Set(
	['attempt', 'hang dog', 'hangdog', 'working', 'retreat', 'dab', 'hit', 'target', 'mark'].map(
		(s) => s.toLowerCase()
	)
);

export function classifyTick(tick: string | null | undefined): {
	isSend: boolean;
	isAttempt: boolean;
} {
	const key = (tick ?? '').trim().toLowerCase();
	if (!key) return { isSend: false, isAttempt: false };
	if (ATTEMPT_TICKS.has(key)) return { isSend: false, isAttempt: true };
	if (SEND_TICKS.has(key) || soloTickKind(key) != null) return { isSend: true, isAttempt: false };
	// Second / top rope clean still counts as send for volume analytics
	if (key.includes('point') || key.includes('sight') || key === 'second') {
		return { isSend: true, isAttempt: false };
	}
	return { isSend: false, isAttempt: false };
}
