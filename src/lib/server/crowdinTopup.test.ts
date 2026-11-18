import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain JS module shared with scripts/crowdin-topup.mjs (no .d.ts)
import {
	DEFAULT_BUDGET_SECONDS,
	DEFAULT_MODELS,
	githubOutputLine,
	isLanguageComplete,
	isUnavailableModel,
	parseBudgetSeconds,
	parseList,
	passDecision,
	runExitCode,
	sortLanguagesByProgress
} from '../../../scripts/crowdinTopup.mjs';

describe('Crowdin CLI permission failures', () => {
	it.each([
		[
			'Endpoint requires the project.status.progress:read scope.',
			'Translation status > Project progress > Read only'
		],
		['Access denied to this project.', 'progress check failed: HTTP 403']
	])('stops before model changes or translation for %s', (message, expected) => {
		const mock = `globalThis.fetch = async (url, options) => {
			if (options.method !== 'GET') throw Error('Unexpected mutation');
			const path = new URL(url).pathname;
			if (path.endsWith('/user')) return Response.json({ data: { id: 1 } });
			if (path.endsWith('/ai/prompts')) return Response.json({ data: [{ data: { id: 2, name: 'Crag Stats pre-translate', action: 'pre_translate', aiModelId: 'gemini-4-hydrogen' } }] });
			if (path.endsWith('/files')) return Response.json({ data: [{ data: { id: 3, path: '/src/lib/i18n/locales/en.json' } }] });
			if (path.endsWith('/languages/progress')) return Response.json({ error: { message: ${JSON.stringify(message)} } }, { status: 403 });
			throw Error('Unexpected request');
		};`;
		const result = spawnSync(
			process.execPath,
			[
				'--import',
				`data:text/javascript,${encodeURIComponent(mock)}`,
				fileURLToPath(new URL('../../../scripts/crowdin-topup.mjs', import.meta.url))
			],
			{
				encoding: 'utf8',
				timeout: 5000,
				env: { CROWDIN_PROJECT_ID: '1', CROWDIN_PERSONAL_TOKEN: 'test-only' }
			}
		);
		expect(result.error).toBeUndefined();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(expected);
		expect(result.stderr).not.toContain('Unexpected');
		if (message.includes('project.status.progress:read')) {
			expect(result.stderr).toContain('CROWDIN_PERSONAL_TOKEN');
			expect(result.stderr).toContain('rerun the workflow');
		}
	});
});

describe('crowdin top-up rotation', () => {
	it('keeps one entry per model, strongest first, without quota-sharing aliases', () => {
		expect(new Set(DEFAULT_MODELS).size).toBe(DEFAULT_MODELS.length);
		expect(DEFAULT_MODELS[0]).toBe('gemini-4-hydrogen');
		// `-latest` ids share the quota of the model they point at, so rotating into one is a no-op.
		expect(DEFAULT_MODELS.filter((id: string) => id.endsWith('-latest'))).toEqual([]);
	});

	it('rotates only full Flash models so translation quality does not drop', () => {
		// Flash Lite carries a much larger daily allowance, but it is the tier that drifts on ICU
		// plurals, {placeholders}, and glossary terms — and that drift costs a re-review.
		expect(DEFAULT_MODELS.filter((id: string) => id.includes('lite'))).toEqual([]);
		expect(DEFAULT_MODELS).not.toContain('gemini-2.5-flash');
	});

	it('drops retired model ids instead of leaving them as a fallback', () => {
		// gemini-3.7-flash is gone from Google's API; a dead id costs a failed pass plus a 65 s
		// retry before the rotation moves on.
		expect(DEFAULT_MODELS).not.toContain('gemini-3.7-flash');
	});
});

describe('parseList', () => {
	it('trims and drops blanks', () => {
		expect(parseList(' a, b ,,c ')).toEqual(['a', 'b', 'c']);
	});

	it('returns an empty list for missing or empty values', () => {
		expect(parseList(undefined)).toEqual([]);
		expect(parseList('')).toEqual([]);
		expect(parseList(' , ')).toEqual([]);
	});
});

describe('parseBudgetSeconds', () => {
	it('accepts a positive whole number of seconds', () => {
		expect(parseBudgetSeconds('600')).toBe(600);
		expect(parseBudgetSeconds(' 600 ')).toBe(600);
	});

	it('falls back instead of crashing a scheduled run', () => {
		expect(parseBudgetSeconds(undefined)).toBe(DEFAULT_BUDGET_SECONDS);
		expect(parseBudgetSeconds('')).toBe(DEFAULT_BUDGET_SECONDS);
		expect(parseBudgetSeconds('0')).toBe(DEFAULT_BUDGET_SECONDS);
		expect(parseBudgetSeconds('-5')).toBe(DEFAULT_BUDGET_SECONDS);
		expect(parseBudgetSeconds('1.5')).toBe(DEFAULT_BUDGET_SECONDS);
		expect(parseBudgetSeconds('soon')).toBe(DEFAULT_BUDGET_SECONDS);
	});
});

describe('isUnavailableModel', () => {
	const notExists = {
		errors: [{ error: { key: 'aiModelId', code: 'notExists' } }]
	};

	it('recognises the retired-model validation error, parsed or raw', () => {
		expect(isUnavailableModel(notExists)).toBe(true);
		expect(isUnavailableModel(JSON.stringify(notExists))).toBe(true);
	});

	it('recognises it when every error is the same validation error', () => {
		expect(
			isUnavailableModel({
				errors: [
					{ error: { key: 'aiModelId', code: 'notExists' } },
					{ error: { key: 'aiModelId', code: 'notExists' } }
				]
			})
		).toBe(true);
	});

	it('does not treat auth, rate-limit, or mixed errors as a retired model', () => {
		expect(isUnavailableModel({ errors: [{ error: { key: 'token', code: 'denied' } }] })).toBe(
			false
		);
		expect(
			isUnavailableModel({
				errors: [
					{ error: { key: 'aiModelId', code: 'notExists' } },
					{ error: { key: 'token', code: 'denied' } }
				]
			})
		).toBe(false);
	});

	it('treats a wrong code on the right key as a different failure', () => {
		expect(isUnavailableModel({ errors: [{ error: { key: 'aiModelId', code: 'invalid' } }] })).toBe(
			false
		);
	});

	it('cannot establish unavailability from an unknown or truncated body', () => {
		expect(isUnavailableModel('{"errors":[{"error":{"key":"aiMod')).toBe(false);
		expect(isUnavailableModel('')).toBe(false);
		expect(isUnavailableModel(null)).toBe(false);
		expect(isUnavailableModel(undefined)).toBe(false);
		expect(isUnavailableModel({})).toBe(false);
		expect(isUnavailableModel({ errors: [] })).toBe(false);
		expect(isUnavailableModel({ errors: 'aiModelId' })).toBe(false);
		expect(isUnavailableModel({ errors: [null] })).toBe(false);
	});
});

describe('passDecision', () => {
	it('keeps a model that added strings', () => {
		expect(passDecision({ added: 12, retried: false })).toBe('advance');
		expect(passDecision({ added: 12, retried: true })).toBe('advance');
	});

	it('waits out the per-minute window on the first empty pass', () => {
		expect(passDecision({ added: 0, retried: false })).toBe('retry');
	});

	it('rotates once a full window added nothing, so the daily quota is gone', () => {
		expect(passDecision({ added: 0, retried: true })).toBe('rotate');
	});

	it('treats a shrinking catalogue as no progress rather than a working model', () => {
		expect(passDecision({ added: -3, retried: false })).toBe('retry');
		expect(passDecision({ added: -3, retried: true })).toBe('rotate');
	});
});

describe('isLanguageComplete', () => {
	it('is complete only when every string is translated', () => {
		expect(isLanguageComplete({ translated: 154, total: 154 })).toBe(true);
		expect(isLanguageComplete({ translated: 154, total: 160 })).toBe(false);
	});

	it('does not call an empty catalogue complete', () => {
		expect(isLanguageComplete({ translated: 0, total: 0 })).toBe(false);
		expect(isLanguageComplete(undefined)).toBe(false);
	});

	it('tolerates a moved goalpost: total shrinking below translated', () => {
		expect(isLanguageComplete({ translated: 160, total: 154 })).toBe(true);
	});
});

describe('sortLanguagesByProgress', () => {
	it('puts the languages closest to done first', () => {
		const sorted = sortLanguagesByProgress([
			{ languageId: 'ko', translated: 0, total: 154 },
			{ languageId: 'pt-PT', translated: 154, total: 154 },
			{ languageId: 'de', translated: 145, total: 154 }
		]);
		expect(sorted.map((entry) => entry.languageId)).toEqual(['pt-PT', 'de', 'ko']);
	});

	it('keeps the caller order for equal progress and does not mutate the input', () => {
		const input = [
			{ languageId: 'ja', translated: 10, total: 154 },
			{ languageId: 'pl', translated: 10, total: 154 }
		];
		const sorted = sortLanguagesByProgress(input);
		expect(sorted.map((entry) => entry.languageId)).toEqual(['ja', 'pl']);
		expect(input.map((entry) => entry.languageId)).toEqual(['ja', 'pl']);
	});
});

describe('githubOutputLine', () => {
	it('writes the single line the workflow reads', () => {
		expect(githubOutputLine(0)).toBe('added=0\n');
		expect(githubOutputLine(42)).toBe('added=42\n');
	});
});

describe('runExitCode', () => {
	it('exits 0 when quota is spent after finished passes or when strings were added', () => {
		expect(runExitCode({ totalAdded: 0, failedPasses: 0, finishedPasses: 10 })).toBe(0);
		expect(runExitCode({ totalAdded: 25, failedPasses: 1, finishedPasses: 3 })).toBe(0);
		expect(runExitCode({ totalAdded: 0, failedPasses: 0, finishedPasses: 0 })).toBe(0);
	});

	it('exits 1 when every attempted pass failed or was cancelled without adding strings', () => {
		expect(runExitCode({ totalAdded: 0, failedPasses: 5, finishedPasses: 0 })).toBe(1);
	});
});
