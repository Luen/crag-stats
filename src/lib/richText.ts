/**
 * Inline markup for translated sentences.
 *
 * One catalogue key holds one whole sentence, so a translator can move its parts around. Two kinds
 * of inline content are supported, and both end up as real elements rather than `{@html}`, so
 * catalogue text can never inject markup:
 *
 * - `**bold**`, `*italic*`, and `` `code` `` wrap words that need translating in place.
 * - `{name}` tokens name a `RichToken`, for content that must not be translated: environment
 *   variables, file names, and links whose label and target come from elsewhere.
 */

export type RichToken =
	| { kind: 'code'; text: string }
	| { kind: 'strong'; text: string }
	| { kind: 'em'; text: string }
	| { kind: 'link'; text: string; href: string; external?: boolean };

export type RichNode =
	| { key: string; kind: 'text'; text: string }
	| {
			key: string;
			kind: 'strong' | 'em' | 'code' | 'link';
			children: RichNode[];
			href?: string;
			external?: boolean;
	  };

type Marker = { marker: string; kind: 'strong' | 'em' | 'code' };

// `**` has to win over `*` at the same position, hence the order and the length tie-break below.
const MARKERS: Marker[] = [
	{ marker: '**', kind: 'strong' },
	{ marker: '*', kind: 'em' },
	{ marker: '`', kind: 'code' }
];
const MAX_DEPTH = 3;

function findNextMarker(input: string, from: number): { index: number; marker: Marker } | null {
	let best: { index: number; marker: Marker } | null = null;
	for (const marker of MARKERS) {
		const index = input.indexOf(marker.marker, from);
		if (index === -1) continue;
		if (
			best === null ||
			index < best.index ||
			(index === best.index && marker.marker.length > best.marker.marker.length)
		) {
			best = { index, marker };
		}
	}
	return best;
}

function parseMarkup(input: string, depth: number, next: () => string): RichNode[] {
	const nodes: RichNode[] = [];
	let cursor = 0;
	let textStart = 0;

	while (cursor < input.length) {
		const hit = findNextMarker(input, cursor);
		if (!hit) break;
		const { marker } = hit;
		const close = input.indexOf(marker.marker, hit.index + marker.marker.length);
		if (close === -1) {
			// Unmatched marker: keep the characters as text and look for a later pair.
			cursor = hit.index + marker.marker.length;
			continue;
		}

		if (hit.index > textStart) {
			nodes.push({ key: next(), kind: 'text', text: input.slice(textStart, hit.index) });
		}

		const inner = input.slice(hit.index + marker.marker.length, close);
		const children =
			depth >= MAX_DEPTH
				? [{ key: next(), kind: 'text' as const, text: inner }]
				: parseMarkup(inner, depth + 1, next);
		nodes.push({ key: next(), kind: marker.kind, children });

		cursor = close + marker.marker.length;
		textStart = cursor;
	}

	if (textStart < input.length) {
		nodes.push({ key: next(), kind: 'text', text: input.slice(textStart) });
	}

	return nodes;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace `{name}` tokens inside text nodes; unknown names stay literal. */
function resolveTokens(
	nodes: RichNode[],
	tokens: Record<string, RichToken>,
	pattern: RegExp | null,
	next: () => string
): RichNode[] {
	return nodes
		.map((node) => {
			if (node.kind !== 'text') {
				return { ...node, children: resolveTokens(node.children, tokens, pattern, next) };
			}
			if (!pattern) return node;

			const parts: RichNode[] = [];
			let last = 0;
			for (const match of node.text.matchAll(pattern)) {
				const start = match.index ?? 0;
				const token = tokens[match[1]];
				if (!token) continue;
				if (start > last) {
					parts.push({ key: next(), kind: 'text', text: node.text.slice(last, start) });
				}
				parts.push({
					key: next(),
					kind: token.kind,
					children: [{ key: next(), kind: 'text', text: token.text }],
					...(token.kind === 'link' ? { href: token.href, external: token.external } : {})
				});
				last = start + match[0].length;
			}
			if (parts.length === 0) return node;
			if (last < node.text.length) {
				parts.push({ key: next(), kind: 'text', text: node.text.slice(last) });
			}
			return parts;
		})
		.flat()
		.filter((node) => node.kind !== 'text' || node.text.length > 0);
}

/**
 * Turn a translated sentence plus its tokens into a render tree.
 *
 * Emphasis comes from the sentence itself; tokens are substituted afterwards so a token can sit
 * inside emphasis (`**No {appPassword} is set.**`).
 */
export function parseRichText(message: string, tokens: Record<string, RichToken> = {}): RichNode[] {
	let counter = 0;
	const next = () => `n${counter++}`;
	const names = Object.keys(tokens);
	const pattern =
		names.length === 0 ? null : new RegExp(`\\{(${names.map(escapeRegExp).join('|')})\\}`, 'g');
	return resolveTokens(parseMarkup(message, 0, next), tokens, pattern, next);
}
