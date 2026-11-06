import { expect, it } from 'vitest';
import { sessionReadiness } from './readiness';

it('caps the initial model at 94, adds one point per additional session, and never reaches 100', () => {
	expect([1, 2, 3, 4, 5, 6, 100].map((n) => sessionReadiness(100, n))).toEqual([
		94, 95, 96, 97, 98, 99, 99
	]);
	expect(sessionReadiness(40, 4)).toBe(43);
	expect(sessionReadiness(40, 0)).toBe(40);
	expect(sessionReadiness(45.3, 2)).toBe(46.3);
});
