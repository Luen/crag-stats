import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STYLE_BADGE_COLORS } from './ticks';

const css = readFileSync(join(__dirname, '..', 'app.css'), 'utf8');

const TOKEN_FOR: Record<string, string> = {
	Sport: '--style-sport',
	Trad: '--style-trad',
	Boulder: '--style-boulder',
	'Top rope': '--style-toprope',
	Alpine: '--style-alpine',
	Aid: '--style-aid',
	Unknown: '--style-unknown'
};

describe('theme tokens', () => {
	it('CSS discipline tokens match STYLE_BADGE_COLORS', () => {
		for (const [style, token] of Object.entries(TOKEN_FOR)) {
			const m = css.match(new RegExp(String.raw`${token}:\s*(#[0-9a-fA-F]{6})`));
			expect(m?.[1]?.toLowerCase(), token).toBe(STYLE_BADGE_COLORS[style].toLowerCase());
		}
	});
});
