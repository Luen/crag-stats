import { describe, expect, it } from 'vitest';
import { STYLE_COLORS, styleBadgeColor, tickKind } from './ticks';

describe('tickKind', () => {
	it('normalises theCrag tick names', () => {
		expect(tickKind('Onsight')).toBe('onsight');
		expect(tickKind('Flash')).toBe('flash');
		expect(tickKind('Red point')).toBe('redpoint');
		expect(tickKind('Pinkpoint')).toBe('pinkpoint');
		expect(tickKind('Top rope')).toBe('toprope');
		expect(tickKind('Clean')).toBe('clean');
		expect(tickKind('mystery')).toBe('other');
	});
});

describe('styleBadgeColor', () => {
	it('keeps theCrag-like sport/trad/boulder palette', () => {
		expect(STYLE_COLORS.Sport).toBe('#1d6fa5');
		expect(STYLE_COLORS.Trad).toBe('#e07a2f');
		expect(STYLE_COLORS.Boulder).toBe('#a12b4a');
		expect(styleBadgeColor('Sport')).toBe(STYLE_COLORS.Sport);
		expect(styleBadgeColor('trad')).toBe(STYLE_COLORS.Trad);
		expect(styleBadgeColor('Boulder')).toBe(STYLE_COLORS.Boulder);
	});
});
