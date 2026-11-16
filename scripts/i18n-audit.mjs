#!/usr/bin/env node
/**
 * Report user-visible English still hard-coded in Svelte markup (#492) and module-level UI
 * builders / label tables (#495).
 *
 * Usage: node scripts/i18n-audit.mjs [--verbose]
 *
 * Heuristics only:
 * 1. Svelte markup: strips <script>, <style>, comments, and expressions, then counts text nodes
 *    and literal attribute values that still read as prose.
 * 2. Module-level UI surfaces: scans the server builders and .ts label tables for literal prose
 *    in user-facing copy properties (label, title, description, hint, summary, tips, alt, detail,
 *    means, nextStep, blurb, progressLabel, targetLabel, statusLabel) that bypass `formatMessage`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

const ATTRIBUTES = [
	['aria-label', /\saria-label="([^"]+)"/g],
	['title', /\stitle="([^"]+)"/g],
	['placeholder', /\splaceholder="([^"]+)"/g],
	['alt', /\salt="([^"]+)"/g]
];

/** UI-facing .ts builders and label tables audited for module-level hard-coded copy (#495). */
const MODULE_SURFACES = [
	'src/lib/dashboardLayout.ts',
	'src/lib/units.ts',
	'src/lib/dates.ts',
	'src/lib/grades/format.ts',
	'src/lib/weekdayStats.ts',
	'src/lib/partnerStats.ts',
	'src/lib/routeRepeats.ts',
	'src/lib/eddingtonDisplay.ts',
	'src/lib/rockTypes.ts',
	'src/lib/suggestedGoals.ts',
	'src/lib/weatherStats.ts',
	'src/lib/weatherPerformance.ts',
	'src/lib/server/climberBlurb.ts',
	'src/lib/server/eddington.ts',
	'src/lib/server/eddingtonPage.ts',
	'src/lib/server/badges.ts',
	'src/lib/server/communityBadges.ts',
	'src/lib/server/routeSetters.ts',
	'src/lib/server/goals.ts',
	'src/lib/server/goalsShared.ts',
	'src/lib/server/suggestedGoals.ts',
	'src/lib/server/projectProgress.ts',
	'src/lib/server/projectDetails.ts',
	'src/lib/server/dashboardExtras.ts',
	'src/routes/share/+page.server.ts'
];

const COPY_PROPERTY_PATTERN =
	/\b(label|title|description|hint|summary|tips|alt|detail|earnedDetail|means|nextStep|blurb|progressLabel|targetLabel|statusLabel)\s*:\s*(['"`])((?:\\.|(?!\2)[^\\\r\n])+)\2/g;

function svelteFiles(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
			svelteFiles(full, out);
		} else if (entry.name.endsWith('.svelte')) {
			out.push(full);
		}
	}
	return out;
}

function stripBlocks(source, tag) {
	// `<tag` must be a real element, not a component such as `<StylePyramid>` or `<Scripted…>`.
	const haystack = source.toLowerCase();
	const open = new RegExp(`<${tag}(?=[\\s>])`, 'g');
	const close = `</${tag}>`;
	let out = '';
	let i = 0;
	while (true) {
		open.lastIndex = i;
		const match = open.exec(haystack);
		if (!match) {
			out += source.slice(i);
			break;
		}
		const start = match.index;
		out += source.slice(i, start);
		const end = haystack.indexOf(close, start);
		if (end === -1) break;
		i = end + close.length;
	}
	return out;
}

function stripBraceExpressions(source) {
	let out = '';
	let depth = 0;
	for (const char of source) {
		if (char === '{') {
			depth += 1;
			continue;
		}
		if (char === '}') {
			if (depth > 0) depth -= 1;
			else out += char;
			continue;
		}
		if (depth === 0) out += char;
	}
	return out;
}

function stripComments(source) {
	let out = '';
	let i = 0;
	while (true) {
		const start = source.indexOf('<!--', i);
		if (start === -1) {
			out += source.slice(i);
			break;
		}
		out += source.slice(i, start);
		const end = source.indexOf('-->', start);
		if (end === -1) break;
		i = end + 3;
	}
	return out;
}

function stripNonMarkup(source) {
	const withoutBlocks = stripBlocks(stripBlocks(source, 'script'), 'style');
	return stripBraceExpressions(stripComments(withoutBlocks));
}

const looksLikeProse = (text) => /[A-Za-z]{2}/.test(text) && !/^[\s·×—–%.,:;/|()\-+]+$/.test(text);

function stripJsComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const report = [];
let total = 0;

for (const file of svelteFiles(path.join(repo, 'src')).sort()) {
	const source = fs.readFileSync(file, 'utf8');
	const markup = stripNonMarkup(source);
	const found = [];

	for (const match of markup.matchAll(/>([^<>]+)</g)) {
		const text = match[1].replace(/\s+/g, ' ').trim();
		if (text && looksLikeProse(text)) found.push(text);
	}
	for (const [attr, pattern] of ATTRIBUTES) {
		for (const match of markup.matchAll(pattern)) {
			const text = match[1].trim();
			if (text && looksLikeProse(text)) found.push(`[${attr}] ${text}`);
		}
	}

	if (!found.length) continue;
	total += found.length;
	report.push({ file: path.relative(repo, file), count: found.length, samples: found.slice(0, 3) });
}

report.sort((a, b) => b.count - a.count);
for (const row of report) {
	const sample = verbose ? `\n    ${row.samples.join('\n    ')}` : '';
	console.log(`${String(row.count).padStart(4)}  ${row.file}${sample}`);
}
console.log(`\n${total} hard-coded strings across ${report.length} files`);

const moduleReport = [];
let moduleTotal = 0;

for (const rel of MODULE_SURFACES) {
	const full = path.join(repo, rel);
	if (!fs.existsSync(full)) continue;
	const source = stripJsComments(fs.readFileSync(full, 'utf8'));
	const found = [];
	for (const match of source.matchAll(COPY_PROPERTY_PATTERN)) {
		const prop = match[1];
		const raw = stripBraceExpressions(match[3].replace(/\$\{/g, '{')).trim();
		if (raw && looksLikeProse(raw)) found.push(`[${prop}] ${match[3].trim()}`);
	}
	if (!found.length) continue;
	moduleTotal += found.length;
	moduleReport.push({
		file: path.normalize(rel),
		count: found.length,
		samples: found.slice(0, 3)
	});
}

moduleReport.sort((a, b) => b.count - a.count);
for (const row of moduleReport) {
	const sample = verbose ? `\n    ${row.samples.join('\n    ')}` : '';
	console.log(`${String(row.count).padStart(4)}  ${row.file}${sample}`);
}
console.log(
	`${moduleTotal} hard-coded module copy strings across ${moduleReport.length}/${MODULE_SURFACES.length} builder & label files`
);
