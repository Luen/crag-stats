import en from './locales/en.json' with { type: 'json' };
import de from './locales/de.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };
import es from './locales/es.json' with { type: 'json' };
import it from './locales/it.json' with { type: 'json' };
import type { SupportedLocale } from './types';

export const LOCALES: Record<SupportedLocale, Record<string, unknown>> = {
	en,
	de,
	fr,
	es,
	it
};

type NestedKeyOf<ObjectType extends object> = {
	[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
		? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
		: `${Key}`;
}[keyof ObjectType & (string | number)];

export type MessageKey = NestedKeyOf<typeof en> | (string & {});
export type MessageParams = Record<string, string | number | undefined | null>;

function lookup(dict: Record<string, unknown>, path: string): string | undefined {
	if (path in dict && typeof dict[path] === 'string') {
		return dict[path] as string;
	}
	const parts = path.split('.');
	let current: unknown = dict;
	for (const part of parts) {
		if (current == null || typeof current !== 'object') return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === 'string' ? current : undefined;
}

function parsePluralBranches(branchesStr: string): Record<string, string> {
	const branches: Record<string, string> = {};
	let i = 0;
	const len = branchesStr.length;

	while (i < len) {
		while (i < len && /\s/.test(branchesStr[i])) i++;
		if (i >= len) break;

		const keyStart = i;
		while (i < len && !/\s|\{/.test(branchesStr[i])) i++;
		const key = branchesStr.slice(keyStart, i).trim();

		while (i < len && /\s/.test(branchesStr[i])) i++;
		if (i >= len || branchesStr[i] !== '{') break;

		i++; // skip opening '{'
		const contentStart = i;
		let depth = 1;
		while (i < len && depth > 0) {
			if (branchesStr[i] === '{') depth++;
			else if (branchesStr[i] === '}') depth--;
			i++;
		}

		if (key && depth === 0) {
			branches[key] = branchesStr.slice(contentStart, i - 1);
		}
	}

	return branches;
}

function selectPluralCategory(locale: SupportedLocale, count: number): string {
	try {
		return new Intl.PluralRules(locale).select(count);
	} catch {
		return count === 1 ? 'one' : 'other';
	}
}

function evaluatePlural(locale: SupportedLocale, count: number, branchesStr: string): string {
	const branches = parsePluralBranches(branchesStr);

	const exact = `=${count}`;
	let template = branches[exact];
	if (template === undefined) {
		const category = selectPluralCategory(locale, count);
		if (branches[category] !== undefined) {
			template = branches[category];
		} else if (count === 1 && branches['one'] !== undefined) {
			template = branches['one'];
		} else if (branches['other'] !== undefined) {
			template = branches['other'];
		} else {
			template = Object.values(branches)[0] ?? '';
		}
	}

	return template.replace(/#/g, String(count));
}

function processPlurals(locale: SupportedLocale, input: string, params: MessageParams): string {
	const prefix = /\{(\w+),\s*plural,\s*/g;
	let result = '';
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = prefix.exec(input)) !== null) {
		result += input.slice(lastIndex, match.index);
		const varName = match[1];
		let depth = 1;
		let i = prefix.lastIndex;
		while (i < input.length && depth > 0) {
			if (input[i] === '{') depth++;
			else if (input[i] === '}') depth--;
			i++;
		}
		if (depth === 0) {
			const branches = input.slice(prefix.lastIndex, i - 1);
			const val = params[varName];
			const num = typeof val === 'number' ? val : Number(val ?? 0);
			result += evaluatePlural(locale, isNaN(num) ? 0 : num, branches);
			lastIndex = i;
			prefix.lastIndex = i;
		} else {
			result += match[0];
			lastIndex = prefix.lastIndex;
		}
	}

	result += input.slice(lastIndex);
	return result;
}

export function formatMessage(
	locale: SupportedLocale,
	key: string,
	params?: MessageParams
): string {
	let raw = lookup(LOCALES[locale] ?? LOCALES.en, key);
	if (raw === undefined && locale !== 'en') {
		raw = lookup(LOCALES.en, key);
	}
	if (raw === undefined) {
		return key;
	}
	if (!params) {
		return raw;
	}

	// 1. Process ICU plural blocks
	let result = processPlurals(locale, raw, params);

	// 2. Process standard parameter interpolation: {name}
	result = result.replace(/\{(\w+)\}/g, (match, paramName) => {
		const val = params[paramName];
		return val !== undefined && val !== null ? String(val) : match;
	});

	return result;
}
