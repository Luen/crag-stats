import { beforeEach, expect, it } from 'vitest';
import { ascentPartners } from '#lib/partnerStats';
import { getDashboardStats, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
import { buildBadges } from './badges';
import { buildMilestones } from './dashboardExtras';

beforeEach(() => wipeAllData());

it('deduplicates names without losing display case and omits unknown companions', () => {
	expect(ascentPartners('@Alex, alex; Sam and Jo')).toBe('Partners on this ascent: Alex, Sam, Jo');
	expect(ascentPartners(' , ; ')).toBeNull();
	expect(ascentPartners(null)).toBeNull();
});

it('attributes a day badge only to the linked qualifying ascent, not every companion that day', () => {
	const rows = [1, 2, 3].map((n) => ({
		ascentId: n,
		ascentDate: '2026-10-31',
		routeId: 1,
		routeName: 'Synthetic pitches',
		pitchLabel: `P${n}`,
		isSend: true,
		partners: n === 3 ? 'Alex, Sam, Jo' : 'Other partner',
		ascentUrl: `https://www.thecrag.com/ascent/${n}`
	}));
	const earned = buildBadges(rows).earned;
	for (const id of ['multipitch_day', 'partners_crowded_belay']) {
		const badge = earned.find((b) => b.id === id)!;
		expect(badge.href).toBe(rows[2].ascentUrl);
		expect(badge.detail).toContain('Partners on this ascent: Alex, Sam, Jo');
		expect(badge.detail).not.toContain('Other partner');
	}
});

it('retains the selected ascent partners through ingest and dashboard aggregation', () => {
	for (const [i, partners] of ['Alex, Sam', 'Jo'].entries()) {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: `partners-${i}`,
				ascentDate: `2026-10-${20 + i}`,
				tickType: 'Onsight',
				isSend: true,
				isAttempt: false,
				partners,
				route: {
					provider: 'thecrag',
					externalId: 'partner-route',
					name: 'Synthetic route',
					gearStyle: 'Sport',
					gradeScore: 20,
					gradeRaw: '20',
					gradeSystem: 'ewbank'
				}
			}
		]);
	}
	const stats = getDashboardStats();
	const hardest = stats.hardestSends[0];
	expect(hardest.partners).toBe(stats.recent.find((r) => r.id === hardest.id)?.partners);
	const notable = stats.notableByStyle.find((r) => r.group === 'Sport')!;
	expect(notable.hardestPartners).toBe(
		stats.hardestSends.find((r) => r.url === notable.hardestUrl)?.partners
	);
	const milestone = buildMilestones([
		{
			ascentDate: '2026-10-31',
			isSend: true,
			gradeScore: 20,
			routeName: 'Synthetic route',
			partners: 'Jo'
		}
	]).items.find((m) => m.kind === 'grade');
	expect(milestone?.detail).toContain('Partners on this ascent: Jo');
});
