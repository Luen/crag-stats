import { beforeEach, expect, it } from 'vitest';
import { listLogbook, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
beforeEach(() => wipeAllData());
it('leaderboard exact links distinguish Ann from Anna while free search remains substring (#109)', () => {
	upsertAscents(
		['Ann', 'Anna', 'Sam, ANN'].map((partners, i) => ({
			provider: 'thecrag',
			externalId: 'a' + i,
			ascentDate: '2026-01-01',
			partners,
			isSend: true,
			isAttempt: false,
			route: { provider: 'thecrag', externalId: 'r' + i, name: 'Synthetic' }
		}))
	);
	expect(listLogbook({ with: 'Ann' }).total).toBe(3);
	expect(listLogbook({ with: 'ann', partnerMatch: 'exact' }).total).toBe(2);
});
