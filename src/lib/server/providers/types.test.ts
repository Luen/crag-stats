import { describe, expect, it } from 'vitest';
import { classifyTick } from './types';

describe('classifyTick', () => {
	it('marks send ticks', () => {
		for (const t of ['Onsight', 'Flash', 'Red point', 'Pink point', 'Tick', 'Send', 'Clean']) {
			expect(classifyTick(t), t).toEqual({ isSend: true, isAttempt: false });
		}
	});

	it('marks attempt ticks', () => {
		for (const t of ['Attempt', 'Hang dog', 'Working', 'Retreat']) {
			expect(classifyTick(t), t).toEqual({ isSend: false, isAttempt: true });
		}
	});

	it('handles empty', () => {
		expect(classifyTick(null)).toEqual({ isSend: false, isAttempt: false });
	});
});
