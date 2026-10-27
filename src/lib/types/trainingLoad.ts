/** Rolling-window counts (unchanged from the original training-load card). */
export type LoadWindow = { ascents: number; sends: number; activeDays: number; heightM: number };

/**
 * Acute:chronic workload ratio bands (Gabbett-style, as used in climbing coaching).
 * - idle: nothing logged recently
 * - detraining: well below your usual load (fresh, or losing fitness)
 * - optimal: the "sweet spot" 0.8–1.3
 * - building: 1.3–1.5, ramping up quickly
 * - spike: > 1.5, the zone most associated with overuse injuries (fingers!)
 */
export type LoadStatus = 'idle' | 'detraining' | 'optimal' | 'building' | 'spike';

export type TrainingLoadView = {
	last7: LoadWindow;
	last28: LoadWindow;
	sendRate7: number;
	sendRate28: number;
	restDays7: number;
	restDays28: number;
	/** 7-day exponentially weighted daily load (fatigue). */
	acute: number;
	/** 28-day exponentially weighted daily load (fitness). */
	chronic: number;
	/** acute / chronic, null when there is no chronic base yet. */
	ratio: number | null;
	status: LoadStatus;
	/** Reference "year max" grades the intensity is measured against. */
	refRoute: number | null;
	refBoulder: number | null;
	/** Sends in the last 28 days within one step of the year max (2 Ewbank / 1 V-grade). */
	limitSends28: number;
	/** Share (0–100) of the last 28 days' graded ascents that were near the limit. */
	limitShare28: number;
	/** Summed load for the last 12 weeks, oldest first (week ending on `end`). */
	weekly: { end: string; load: number }[];
};
