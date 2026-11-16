#!/usr/bin/env node
/**
 * Pre-translate the Crowdin catalogue with Gemini, rotating models as quotas run out.
 *
 * Crowdin's AI pre-translate spends roughly one Gemini request per batch of strings, and the AI
 * Studio free tier meters requests per day. Critically, RPD is per model, not per project, and the
 * full Flash tier gets ~20 requests/day each. A single model therefore stalls after a few hundred
 * strings, but switching the Crowdin prompt to another model gets a completely fresh allowance.
 *
 * So this script walks the rotation in order, staying on one model until it stops adding strings,
 * then moving to the next. Every entry is a full Flash model: the Flash Lite tier has a far larger
 * allowance but produces weaker translations, and the catalogue's ICU syntax, placeholders, and
 * `maxLength` caps punish that. See docs/dev/TRANSLATIONS.md for the full quota story and
 * scripts/crowdinTopup.mjs for the unit-tested decisions.
 *
 * Every pass asks Crowdin to pre-translate only what is still untranslated, so runs are idempotent
 * — existing or human-reviewed translations are never touched. When every model is spent, the
 * script stops cleanly and the next scheduled run picks up where it left off.
 *
 * A model Crowdin rejects — retired, renamed, or never offered by the prompt's AI provider — is
 * skipped with a warning rather than failing the run, so a stale id costs one step of the rotation
 * instead of the day's top-up.
 *
 * Environment:
 *   CROWDIN_PROJECT_ID       (required) numeric project id
 *   CROWDIN_PERSONAL_TOKEN   (required) personal access token
 *   CROWDIN_AI_PROMPT_NAME   (optional) pre-translate prompt to use
 *   CROWDIN_AI_PROMPT_ID     (optional) bypass the name lookup
 *   CROWDIN_SOURCE_FILE      (optional) source file path within the project
 *   CROWDIN_LANGUAGES        (optional) comma-separated targets; defaults to all
 *   CROWDIN_MODELS           (optional) comma-separated model rotation order
 *   CROWDIN_TOPUP_BUDGET     (optional) wall-clock budget in seconds (default 3000)
 *
 * Writes `added=<n>` to $GITHUB_OUTPUT so a workflow can skip the download when nothing changed.
 */
import { appendFileSync } from 'node:fs';
import {
	DEFAULT_MODELS,
	githubOutputLine,
	isLanguageComplete,
	isUnavailableModel,
	parseBudgetSeconds,
	parseList,
	passDecision,
	sortLanguagesByProgress
} from './crowdinTopup.mjs';

const BASE = 'https://api.crowdin.com/api/v2';

const PROMPT_NAME = process.env.CROWDIN_AI_PROMPT_NAME || 'Crag Stats pre-translate';
const SOURCE_FILE = process.env.CROWDIN_SOURCE_FILE || '/src/lib/i18n/locales/en.json';

const POLL_INTERVAL_MS = 10_000;
/** The AI Studio per-minute limit is a rolling 60 s window; a little over it lets it fully clear. */
const RATE_WINDOW_MS = 65_000;
/** Passes are spaced a full window apart, so each starts with the minute's allowance intact. */
const PASS_GAP_MS = RATE_WINDOW_MS;
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRY_DELAY_MS = 60_000;
/** Retried statuses are transient provider/proxy failures, not request errors. */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const BUDGET_MS = parseBudgetSeconds(process.env.CROWDIN_TOPUP_BUDGET) * 1000;

const TOKEN = process.env.CROWDIN_PERSONAL_TOKEN || '';
const PROJECT = process.env.CROWDIN_PROJECT_ID || '';

class CrowdinError extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (message = '') => console.log(message);

/** Workflow annotation, so a stale model id shows on the run without failing it. */
const warn = (message) => console.log(`::warning::${message}`);

/** Parse `Retry-After` (seconds or an HTTP date); anything unusable falls back to backoff. */
function retryDelayMs(header, attempt) {
	const fallback = Math.min(2 ** attempt * 2000, MAX_RETRY_DELAY_MS);
	if (!header) return fallback;
	const seconds = Number(header);
	if (Number.isFinite(seconds) && seconds >= 0) {
		return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
	}
	const when = Date.parse(header);
	if (Number.isFinite(when)) {
		return Math.min(Math.max(when - Date.now(), 0), MAX_RETRY_DELAY_MS);
	}
	return fallback;
}

/**
 * Call the Crowdin API, returning `{ status, body }` for any HTTP response.
 *
 * Transient failures (429, 5xx, network, timeout) are retried with backoff, because a scheduled
 * run should not lose a day's quota to one dropped connection. Validation errors are returned to
 * the caller so it can tell "this model is gone" from "this request is wrong".
 *
 * `retries` is 0 for the pre-translate POST: a pass that already started would be started a
 * second time, spending quota for a pass we cannot see.
 */
async function call(method, path, body, { retries = 2 } = {}) {
	let lastFailure = 'unknown error';
	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			await sleep(retryDelayMs(lastFailure.retryAfter, attempt));
		}
		let response;
		try {
			response = await fetch(BASE + path, {
				method,
				headers: {
					Authorization: `Bearer ${TOKEN}`,
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: body === undefined ? undefined : JSON.stringify(body),
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
			});
		} catch (err) {
			lastFailure = `network error: ${err?.message ?? err}`;
			continue;
		}

		const text = await response.text();
		let parsed = null;
		if (text.trim()) {
			try {
				parsed = JSON.parse(text);
			} catch {
				parsed = text.slice(0, 400);
			}
		}

		if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
			lastFailure = {
				message: `HTTP ${response.status}`,
				retryAfter: response.headers.get('retry-after')
			};
			continue;
		}
		return { status: response.status, body: parsed };
	}

	throw new CrowdinError(`${method} ${path} failed: ${lastFailure.message ?? lastFailure}`);
}

function requireOk({ status, body }, what) {
	if (status < 200 || status >= 300) {
		throw new CrowdinError(`${what} failed: HTTP ${status} ${describe(body)}`);
	}
	return body;
}

function describe(body) {
	if (body == null) return '';
	if (typeof body === 'string') return body;
	try {
		return JSON.stringify(body).slice(0, 400);
	} catch {
		return String(body);
	}
}

async function userId() {
	const body = requireOk(await call('GET', '/user'), 'user lookup');
	return body.data.id;
}

/** Find the prompt by name, so re-creating it in Crowdin does not break CI. */
async function resolvePrompt(uid) {
	const override = process.env.CROWDIN_AI_PROMPT_ID;
	const body = requireOk(await call('GET', `/users/${uid}/ai/prompts?limit=100`), 'prompt listing');
	for (const item of body.data ?? []) {
		const prompt = item.data;
		const matched = override
			? String(prompt.id) === override
			: prompt.name === PROMPT_NAME && prompt.action === 'pre_translate';
		if (matched) return { id: prompt.id, model: prompt.aiModelId || 'unknown' };
	}
	throw new CrowdinError(
		`no pre_translate prompt ${override || JSON.stringify(PROMPT_NAME)}; ` +
			'create it in Crowdin (AI > Prompts) or set CROWDIN_AI_PROMPT_ID'
	);
}

/**
 * Point the prompt at `model`; false when Crowdin rejects the model itself.
 *
 * Only a 400 with an aiModelId/notExists error identifies an unavailable model. Other failures,
 * including authentication and rate limits, still fail the run.
 */
async function setModel(uid, promptId, model) {
	const { status, body } = await call('PATCH', `/users/${uid}/ai/prompts/${promptId}`, [
		{ op: 'replace', path: '/aiModelId', value: model }
	]);
	if (status === 200) return true;
	if (status === 400 && isUnavailableModel(body)) {
		warn(`skipping ${model}: Crowdin rejected it (HTTP ${status} ${describe(body)})`);
		return false;
	}
	throw new CrowdinError(`could not switch prompt to ${model}: HTTP ${status} ${describe(body)}`);
}

/** Switch the prompt to the first model from `start` on that Crowdin accepts. */
async function switchToUsable(uid, promptId, rotation, start) {
	for (let index = start; index < rotation.length; index++) {
		if (await setModel(uid, promptId, rotation[index])) return index;
	}
	return rotation.length;
}

async function resolveFileId() {
	const body = requireOk(await call('GET', `/projects/${PROJECT}/files?limit=500`), 'file listing');
	for (const item of body.data ?? []) {
		if (item.data?.path === SOURCE_FILE) return item.data.id;
	}
	throw new CrowdinError(
		`source file ${JSON.stringify(SOURCE_FILE)} not found in project ${PROJECT}`
	);
}

function models() {
	const override = parseList(process.env.CROWDIN_MODELS);
	return override.length > 0 ? override : [...DEFAULT_MODELS];
}

/** Translation progress for every target language, refreshed in one API call. */
let progressByLanguage = new Map();

async function refreshProgress() {
	const body = requireOk(
		await call('GET', `/projects/${PROJECT}/languages/progress?limit=100`),
		'progress check'
	);
	const next = new Map();
	for (const item of body.data ?? []) {
		const data = item.data;
		next.set(data.languageId, {
			languageId: data.languageId,
			translated: data.phrases?.translated ?? 0,
			total: data.phrases?.total ?? 0
		});
	}
	progressByLanguage = next;
	return next;
}

function progressFor(language) {
	const entry = progressByLanguage.get(language);
	if (!entry) throw new CrowdinError(`language ${language} not present in project`);
	return entry;
}

async function targetLanguages() {
	const override = parseList(process.env.CROWDIN_LANGUAGES);
	if (override.length > 0) return override;
	const body = requireOk(await call('GET', `/projects/${PROJECT}`), 'project lookup');
	return [...(body.data?.targetLanguageIds ?? [])];
}

async function runPass(language, promptId, fileId, deadline) {
	const started = await call(
		'POST',
		`/projects/${PROJECT}/pre-translations`,
		{
			languageIds: [language],
			fileIds: [fileId],
			method: 'ai',
			aiPromptId: promptId,
			scope: 'untranslated',
			autoApproveOption: 'none'
		},
		{ retries: 0 }
	);
	if (started.status < 200 || started.status >= 300) {
		throw new CrowdinError(
			`could not start pre-translation: HTTP ${started.status} ${describe(started.body)}`
		);
	}

	const identifier = started.body?.data?.identifier;
	if (!identifier) {
		throw new CrowdinError('pre-translation started without an identifier');
	}

	for (;;) {
		if (Date.now() > deadline) return 'timeout';
		await sleep(POLL_INTERVAL_MS);
		const { status, body } = await call(
			'GET',
			`/projects/${PROJECT}/pre-translations/${identifier}`
		);
		if (status !== 200) return `status-unavailable(${status})`;
		const state = body?.data?.status;
		if (state === 'finished' || state === 'failed' || state === 'canceled') return state;
	}
}

/**
 * Translate one language until it is complete, its model is spent, or the budget runs out.
 * Returns the number of strings this language added.
 */
async function translateLanguage(language, promptId, fileId, rotation, state, deadline) {
	let entry = progressFor(language);
	let added = 0;

	while (!isLanguageComplete(entry)) {
		if (state.modelIndex >= rotation.length) {
			log("every model's daily quota is spent — stopping");
			return { added, stopped: 'quota' };
		}
		if (Date.now() > deadline) {
			log('wall-clock budget reached — stopping');
			return { added, stopped: 'budget' };
		}

		const outcome = await runPass(language, promptId, fileId, deadline);
		const before = entry.translated;
		await refreshProgress();
		entry = progressFor(language);
		const gained = entry.translated - before;
		added += gained;
		log(
			`  ${rotation[state.modelIndex].padEnd(24)}${outcome.padEnd(10)}` +
				`${entry.translated}/${entry.total} (+${gained})`
		);

		if (outcome === 'timeout') {
			log('wall-clock budget reached during pre-translation pass — stopping');
			return { added, stopped: 'budget' };
		}
		if (outcome === 'failed' || outcome === 'canceled') {
			warn(`${language}: Crowdin reported the pass ${outcome}`);
		}

		const decision = passDecision({ added: gained, retried: state.retried });
		if (decision === 'retry') {
			// Most likely the per-minute limit, not the day's: the model usually has requests left.
			state.retried = true;
			log(
				`  nothing added -> waiting ${RATE_WINDOW_MS / 1000}s, then retrying ${rotation[state.modelIndex]}`
			);
			await sleep(RATE_WINDOW_MS);
		} else if (decision === 'rotate') {
			// Empty again after a full window, so this model's RPD is gone. Another model has its
			// own, so rotate rather than giving up on the day.
			state.retried = false;
			state.modelIndex = await switchToUsable(state.uid, promptId, rotation, state.modelIndex + 1);
			if (state.modelIndex < rotation.length) {
				log(`  quota spent -> switched to ${rotation[state.modelIndex]}`);
				await sleep(5000);
			}
		} else {
			state.retried = false;
			await sleep(PASS_GAP_MS);
		}
	}

	log(`${language}: COMPLETE`);
	return { added, stopped: null };
}

async function finish(totalAdded, languages) {
	log(`\n+${totalAdded} strings this run`);
	try {
		await refreshProgress();
	} catch (err) {
		log(`  progress summary unavailable (${err?.message ?? err})`);
	}
	for (const language of languages) {
		const entry = progressByLanguage.get(language);
		log(`  ${language.padEnd(8)} ${entry ? `${entry.translated}/${entry.total}` : 'unavailable'}`);
	}

	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, githubOutputLine(totalAdded), 'utf-8');
	}
	return 0;
}

async function main() {
	if (!TOKEN || !PROJECT) {
		console.error('CROWDIN_PERSONAL_TOKEN and CROWDIN_PROJECT_ID must be set');
		return 1;
	}

	const deadline = Date.now() + BUDGET_MS;
	const uid = await userId();
	const prompt = await resolvePrompt(uid);
	const fileId = await resolveFileId();
	const rotation = models();
	if (rotation.length === 0) {
		console.error('the model rotation is empty; set CROWDIN_MODELS or use the defaults');
		return 1;
	}

	await refreshProgress();
	const languages = sortLanguagesByProgress(
		(await targetLanguages()).map((language) => progressFor(language))
	);

	log(`prompt ${prompt.id} (${PROMPT_NAME}) | file ${fileId} (${SOURCE_FILE})`);
	log(`languages ${languages.map((l) => l.languageId)} | rotation ${rotation}`);

	// Keep the prompt on its current model when that is already the best one; otherwise probe from
	// the top so a run after a quota reset starts on the strongest model again.
	const state = {
		uid,
		modelIndex:
			prompt.model === rotation[0] ? 0 : await switchToUsable(uid, prompt.id, rotation, 0),
		retried: false
	};
	if (state.modelIndex >= rotation.length) {
		log('Crowdin rejected every model in the rotation — stopping');
		return finish(
			0,
			languages.map((l) => l.languageId)
		);
	}
	log(`starting on ${rotation[state.modelIndex]}`);

	let totalAdded = 0;
	for (const { languageId: language, translated, total } of languages) {
		if (total === 0) {
			log(`${language}: no strings to translate`);
			continue;
		}
		if (isLanguageComplete({ translated, total })) {
			log(`${language}: already complete (${translated}/${total})`);
			continue;
		}
		log(`${language}: starting at ${translated}/${total}`);

		const result = await translateLanguage(language, prompt.id, fileId, rotation, state, deadline);
		totalAdded += result.added;
		if (result.stopped) break;
	}

	return finish(
		totalAdded,
		languages.map((l) => l.languageId)
	);
}

main().then(
	(code) => {
		process.exitCode = code;
	},
	(err) => {
		console.error(`FAILED: ${err?.stack ?? err}`);
		process.exitCode = 1;
	}
);
