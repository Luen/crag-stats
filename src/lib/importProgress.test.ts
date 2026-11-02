import { describe, expect, it } from 'vitest';
import { freshestSnapshot, importsRunning } from './importProgress';

const snap = (serverNow: number, rh = false, wx = false) => ({
	serverNow,
	routeHistory: { running: rh },
	weatherImport: { running: wx }
});

describe('freshestSnapshot', () => {
	it('uses the page load until a poll arrives', () => {
		const loaded = snap(1000);
		expect(freshestSnapshot(loaded, null)).toBe(loaded);
	});

	it('prefers a poll newer than the page load', () => {
		const polled = snap(2000);
		expect(freshestSnapshot(snap(1000), polled)).toBe(polled);
	});

	it('lets a later page reload (form action) win over an older poll', () => {
		const reloaded = snap(3000);
		expect(freshestSnapshot(reloaded, snap(2000))).toBe(reloaded);
	});
});

describe('importsRunning', () => {
	it('is false when both imports are idle', () => {
		expect(importsRunning(snap(0))).toBe(false);
	});

	it('is true while either import runs', () => {
		expect(importsRunning(snap(0, true, false))).toBe(true);
		expect(importsRunning(snap(0, false, true))).toBe(true);
	});
});
