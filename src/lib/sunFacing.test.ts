import { expect, it } from 'vitest';
import { isSunFacingSummer } from './sunFacing';
const row = (lat = -34, date = '2025-01-01', name = 'N', source = 'route') => ({
	lat,
	ascentDate: date,
	tagsJson: JSON.stringify([{ category: 'Aspect', name, source }])
});
it('uses local summer and equator-facing direct aspects in both hemispheres', () => {
	for (const a of ['N', 'NE', 'NW', 'North East'])
		expect(isSunFacingSummer(row(-34, '2025-01-01', a))).toBe(true);
	for (const a of ['S', 'SE', 'SW', 'South West'])
		expect(isSunFacingSummer(row(34, '2025-07-01', a))).toBe(true);
	expect(isSunFacingSummer(row(-34, '2025-07-01'))).toBe(false);
	expect(isSunFacingSummer(row(34, '2025-01-01', 'S'))).toBe(false);
});
it('does not guess facing from inherited, legacy, conflicting or absent tags', () => {
	expect(isSunFacingSummer(row(-34, '2025-01-01', 'N', 'ancestor'))).toBe(false);
	expect(isSunFacingSummer({ ...row(), tagsJson: '[{"category":"Aspect","name":"N"}]' })).toBe(
		false
	);
	expect(
		isSunFacingSummer({
			...row(),
			tagsJson: JSON.stringify([
				{ category: 'Aspect', name: 'N', source: 'route' },
				{ category: 'Aspect', name: 'S', source: 'route' }
			])
		})
	).toBe(false);
	for (const name of ['E', 'W', 'Unknown'])
		expect(isSunFacingSummer(row(-34, '2025-01-01', name))).toBe(false);
});
it('excludes tropics, high latitudes, bad dates and uncertain location sources', () => {
	for (const lat of [0, 23.44, 24.99, 60, -60, NaN, 90])
		expect(isSunFacingSummer(row(lat))).toBe(false);
	expect(isSunFacingSummer(row(-25))).toBe(true);
	for (const date of ['2018-00-00', '2025-02-29', '2025-06-31', '0000-01-01'])
		expect(isSunFacingSummer(row(-34, date))).toBe(false);
	expect(isSunFacingSummer({ ...row(), weatherLocation: null })).toBe(false);
	for (const source of ['place', 'cached'] as const)
		expect(
			isSunFacingSummer({
				...row(),
				weatherLocation: {
					lat: -34,
					lon: 151,
					source,
					name: 'Unknown precision',
					areaId: null,
					precision: 'unknown',
					resolvedAt: 'now'
				}
			})
		).toBe(false);
});

it('accepts direct All day sun without aspect, but rejects inherited, legacy, partial sun and shade', () => {
	const weather = (name: string, source: string | undefined = 'route') =>
		JSON.stringify([{ category: 'Weather', name, source }]);
	for (const lat of [-34, 34]) {
		const base = row(lat, lat < 0 ? '2025-01-01' : '2025-07-01');
		expect(isSunFacingSummer({ ...base, tagsJson: weather('All day sun') })).toBe(true);
		for (const source of ['ancestor', undefined])
			expect(
				isSunFacingSummer({
					...base,
					tagsJson: JSON.stringify([{ category: 'Weather', name: 'All day sun', source }])
				})
			).toBe(false);
		for (const name of ['Morning sun', 'Noon sun', 'Afternoon sun', 'Always shady'])
			expect(isSunFacingSummer({ ...base, tagsJson: weather(name) })).toBe(false);
	}
	const tagsJson = weather('All day sun');
	expect(isSunFacingSummer({ ...row(-34, '2025-07-01'), tagsJson })).toBe(false);
	expect(isSunFacingSummer({ ...row(-10), tagsJson })).toBe(false);
	expect(isSunFacingSummer({ ...row(), weatherLocation: null, tagsJson })).toBe(false);
	expect(
		isSunFacingSummer({
			...row(),
			tagsJson: JSON.stringify([
				{ category: 'Weather', name: 'All day sun', source: 'route' },
				{ category: 'Weather', name: 'Always shady', source: 'route' }
			])
		})
	).toBe(false);
	expect(
		isSunFacingSummer({
			...row(),
			tagsJson: JSON.stringify([
				{ category: 'Aspect', name: 'N', source: 'route' },
				{ category: 'Weather', name: 'Always shady', source: 'route' }
			])
		})
	).toBe(false);
});
