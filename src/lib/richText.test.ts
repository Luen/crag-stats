import { describe, expect, it } from 'vitest';
import { parseRichText, type RichNode, type RichToken } from './richText';

const code = (text: string): RichToken => ({ kind: 'code', text });

/** Flatten to a comparable shape so assertions stay readable. */
function shape(nodes: RichNode[]): unknown[] {
	return nodes.map((node) =>
		node.kind === 'text'
			? node.text
			: node.kind === 'link'
				? [node.kind, node.href, node.external ?? false, shape(node.children)]
				: [node.kind, shape(node.children)]
	);
}

describe('parseRichText', () => {
	it('returns a plain sentence unchanged', () => {
		expect(shape(parseRichText('Plain sentence.'))).toEqual(['Plain sentence.']);
	});

	it('renders emphasis without keeping the markers', () => {
		expect(shape(parseRichText('CSV import does **not** remove entries.'))).toEqual([
			'CSV import does ',
			['strong', ['not']],
			' remove entries.'
		]);
		expect(shape(parseRichText('*Action → Export logbook as CSV*'))).toEqual([
			['em', ['Action → Export logbook as CSV']]
		]);
	});

	it('prefers ** over * at the same position', () => {
		expect(shape(parseRichText('**bold**'))).toEqual([['strong', ['bold']]]);
	});

	it('nests emphasis and code', () => {
		expect(shape(parseRichText('**No `APP_PASSWORD` is set.** Tail'))).toEqual([
			['strong', ['No ', ['code', ['APP_PASSWORD']], ' is set.']],
			' Tail'
		]);
	});

	it('leaves an unmatched marker as text', () => {
		expect(shape(parseRichText('Two * stars'))).toEqual(['Two * stars']);
		expect(shape(parseRichText('one ** pair'))).toEqual(['one ** pair']);
	});

	it('substitutes tokens, including inside emphasis', () => {
		const nodes = parseRichText('Set {key} in {env}.', {
			key: code('THECRAG_API_KEY'),
			env: code('.env')
		});
		expect(shape(nodes)).toEqual([
			'Set ',
			['code', ['THECRAG_API_KEY']],
			' in ',
			['code', ['.env']],
			'.'
		]);

		expect(
			shape(parseRichText('**No {appPassword} is set.**', { appPassword: code('APP_PASSWORD') }))
		).toEqual([['strong', ['No ', ['code', ['APP_PASSWORD']], ' is set.']]]);
	});

	it('keeps an unknown placeholder as literal text', () => {
		expect(shape(parseRichText('Keep {other} and {key}.', { key: code('KEY') }))).toEqual([
			'Keep {other} and ',
			['code', ['KEY']],
			'.'
		]);
	});

	it('carries link targets and external-link flags through', () => {
		expect(
			shape(
				parseRichText('See {docs}.', {
					docs: { kind: 'link', text: 'API docs', href: 'https://example.com', external: true }
				})
			)
		).toEqual(['See ', ['link', 'https://example.com', true, ['API docs']], '.']);
	});

	it('gives every node a stable key', () => {
		const nodes = parseRichText('**a** {key} b', { key: code('KEY') });
		const keys = JSON.stringify(nodes).match(/"key":"[^"]+"/g) ?? [];
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('does not treat token names as regular expressions', () => {
		expect(shape(parseRichText('a {k.e}y', { 'k.e': code('KEY') }))).toEqual([
			'a ',
			['code', ['KEY']],
			'y'
		]);
	});
});
