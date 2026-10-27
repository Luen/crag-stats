import { describe, expect, it } from 'vitest';
import { tickKind } from './ticks';

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
