#!/usr/bin/env node
/**
 * Report user-visible English still hard-coded in Svelte markup (#492).
 *
 * Usage: node scripts/i18n-audit.mjs [--verbose]
 *
 * Heuristics only: it strips <script>, <style>, comments and expressions, then counts
 * text nodes and literal attribute values that still read as prose. Interpolated and
 * server-supplied copy (page data, docs markdown) is intentionally out of scope.
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
	const haystack = source.toLowerCase();
	const open = `<${tag}`;
	const close = `</${tag}>`;
	let out = '';
	let i = 0;
	while (true) {
		const start = haystack.indexOf(open, i);
		if (start === -1) {
			out += source.slice(i);
			break;
		}
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
