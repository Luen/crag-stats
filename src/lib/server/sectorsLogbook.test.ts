import { beforeEach, expect, it } from 'vitest';
import { db } from './db';
import { routes } from './db/schema';
import { eq } from 'drizzle-orm';
import { upsertAscents } from './ingest';
import { listSectors } from './sectors';
import { listLogbook, wipeAllData } from './analytics';
beforeEach(() => wipeAllData());
it('ancestor links include descendants and distinguish repeated leaf names (#129)', () => {
	for (const [i, area] of ['Upper Sector', 'Other Sector'].entries()) {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'a' + i,
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: {
					provider: 'thecrag',
					externalId: 'r' + i,
					name: 'Synthetic',
					cragName: 'Test Crag',
					parentName: 'Lower Wall'
				}
			}
		]);
		db.update(routes)
			.set({
				ancestorsJson: JSON.stringify([
					{ name: 'World' },
					{ name: 'Test Crag' },
					{ name: area },
					{ name: 'Lower Wall' }
				])
			})
			.where(eq(routes.externalId, 'r' + i))
			.run();
	}
	expect(listSectors()[0].sectors).toHaveLength(2);
	expect(listLogbook({ crag: 'Test Crag', sector: 'Upper Sector' }).total).toBe(1);
	expect(listLogbook({ crag: 'Test Crag', sectorPath: ['Upper Sector'] }).total).toBe(1);
	expect(listLogbook({ crag: 'Test Crag', sectorPath: ['Upper Sector', 'Lower Wall'] }).total).toBe(
		1
	);
	expect(
		listLogbook({ crag: 'Test Crag', sectorPath: ['Other Sector', 'Lower Wall'] }).rows[0]
			.externalId
	).toBe('a1');
});
