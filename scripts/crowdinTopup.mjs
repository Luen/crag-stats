/**
 * Pure helpers for scripts/crowdin-topup.mjs, unit-tested in src/lib/server/crowdinTopup.test.ts.
 *
 * Nothing here touches the network or `process.env`, so the quota state machine — the part that
 * silently wastes a day of Gemini allowance when it is wrong — is testable offline. See
 * docs/dev/TRANSLATIONS.md for the workflow around it.
 */

/**
 * Ordered best-intelligence-first, full Flash tier only.
 *
 * The Flash Lite tier and gemini-2.5-flash used to sit at the end of this list because they carry
 * a much larger free daily allowance (~500 requests/day against ~20). They also produce weaker
 * translations: the catalogue is short UI strings carrying ICU plural syntax, `{placeholders}`,
 * glossary terms, and hard `maxLength` caps, which is exactly where a small model drifts. Now that
 * languages are switched on one at a time, the newest full Flash models comfortably cover a day's
 * work, so quality wins over raw throughput.
 *
 * Every id must be one the prompt's AI provider offers — list them with
 * GET /users/{userId}/ai/providers/{providerId}/models. Aliases such as `gemini-flash-latest` are
 * left out: they share a quota with the model they point to, as do the Gemini 4 frontier models
 * (carbon/argon), which are Pro-class and unlikely to have a free tier. Retired ids cost a wasted
 * pass, so remove them rather than leaving them as a fallback.
 *
 * @type {string[]}
 */
export const DEFAULT_MODELS = [
	'gemini-4-hydrogen',
	'gemini-3.8-flash',
	'gemini-3.6-flash',
	'gemini-3.5-flash',
	'gemini-3-flash-preview'
];

/**
 * Wall-clock budget for one run, in seconds. The job timeout is 60 minutes, so the default
 * leaves room for the final download and PR steps.
 *
 * @type {number}
 */
export const DEFAULT_BUDGET_SECONDS = 3000;

/** @typedef {{ languageId?: string, translated: number, total: number }} LanguageProgress */

/**
 * Split a comma-separated env list, dropping blanks so `a,,b` and `a, b` both work.
 *
 * @param {string | undefined | null} raw
 * @returns {string[]}
 */
export function parseList(raw) {
	if (typeof raw !== 'string') return [];
	return raw
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

/**
 * Parse the wall-clock budget. A typo must not crash the scheduled run, so anything that is not
 * a positive whole number of seconds falls back to the default.
 *
 * @param {string | undefined | null} raw
 * @param {number} [fallback]
 * @returns {number}
 */
export function parseBudgetSeconds(raw, fallback = DEFAULT_BUDGET_SECONDS) {
	if (typeof raw !== 'string') return fallback;
	const trimmed = raw.trim();
	if (!/^\d+$/.test(trimmed)) return fallback;
	const value = Number(trimmed);
	return value > 0 ? value : fallback;
}

/**
 * True only when Crowdin rejects the model id itself (`aiModelId` / `notExists`), which is the
 * one validation error that means "skip this rotation entry rather than fail the run".
 *
 * Auth failures, rate limits and unknown or truncated bodies must not match: treating them as a
 * retired model would quietly walk the whole rotation and then report a spent quota instead of
 * surfacing the real problem.
 *
 * @param {unknown} body
 * @returns {boolean}
 */
export function isUnavailableModel(body) {
	/** @type {any} */
	let parsed = body;
	if (typeof body === 'string') {
		try {
			parsed = JSON.parse(body);
		} catch {
			return false;
		}
	}
	if (!parsed || typeof parsed !== 'object') return false;
	const errors = parsed.errors;
	if (!Array.isArray(errors) || errors.length === 0) return false;
	return errors.every(
		/** @param {any} item */
		(item) =>
			item &&
			typeof item === 'object' &&
			item.error &&
			item.error.key === 'aiModelId' &&
			item.error.code === 'notExists'
	);
}

/**
 * What to do after a pre-translation pass, given how many strings it added.
 *
 * - `advance`: it made progress, so keep this model.
 * - `retry`: nothing added on the first try, which is usually the per-minute cap rather than the
 *   daily one. Wait out the window and give the same model one more pass.
 * - `rotate`: still nothing after a full window, so this model's daily quota is spent and the
 *   next one has its own untouched allowance.
 *
 * A negative delta (a string deleted upstream) counts as no progress; it is not evidence that the
 * model is still working.
 *
 * @param {{ added: number, retried: boolean }} pass
 * @returns {'advance' | 'retry' | 'rotate'}
 */
export function passDecision({ added, retried }) {
	if (added > 0) return 'advance';
	return retried ? 'rotate' : 'retry';
}

/**
 * A language needs no more passes once every string is translated.
 *
 * @param {LanguageProgress | undefined} entry
 * @returns {boolean}
 */
export function isLanguageComplete(entry) {
	if (!entry) return false;
	return entry.total > 0 && entry.translated >= entry.total;
}

/**
 * Finish the languages closest to done first: partial catalogues block the download, and a pass
 * can push one over the line before the run ends. Ties keep the caller's order, and completed
 * languages stay in the list so summaries can report them.
 *
 * @param {LanguageProgress[]} entries
 * @returns {LanguageProgress[]}
 */
export function sortLanguagesByProgress(entries) {
	return [...entries].sort((a, b) => b.translated - a.translated);
}

/**
 * The single `added=<n>` line the workflow reads to decide whether a download and PR are worth
 * opening. Kept here so the format is tested rather than string-built inline.
 *
 * @param {number} added
 * @returns {string}
 */
export function githubOutputLine(added) {
	return `added=${added}\n`;
}

/**
 * Exit code for the top-up run.
 *
 * Spending every model's quota (`finishedPasses > 0` with `totalAdded === 0`) is a normal end of
 * day and exits 0. When every attempted pass ended in `failed` or `canceled` without adding a
 * single string, the provider or prompt itself is broken and the run must fail loudly.
 *
 * @param {{ totalAdded: number, failedPasses: number, finishedPasses: number }} summary
 * @returns {0 | 1}
 */
export function runExitCode({ totalAdded, failedPasses, finishedPasses }) {
	if (failedPasses > 0 && finishedPasses === 0 && totalAdded <= 0) return 1;
	return 0;
}
