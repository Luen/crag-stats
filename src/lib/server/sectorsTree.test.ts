import { describe, expect, it } from 'vitest';
import {
	ancestorAreaNames,
	gearStyleMismatch,
	insertSectorPath,
	parseAncestorsJson,
	pitchCountFromJson,
	sectorPathUnderCrag,
	sectorTreeHasDepth,
	styleFromFlagsJson,
	treeNodeToSectorNode,
	type SectorTreeNode
} from './sectorsTree';

describe('parseAncestorsJson', () => {
	it('reads ancestor arrays from route API', () => {
		const json = JSON.stringify([
			{ id: 1, name: 'World' },
			{ id: 2, name: 'Australia' },
			{ id: 3, name: 'Castle Hill' },
			{ id: 4, name: 'Goldmine' }
		]);
		expect(parseAncestorsJson(json)?.map((a) => a.name)).toEqual([
			'World',
			'Australia',
			'Castle Hill',
			'Goldmine'
		]);
	});

	it('builds a short chain from logbook-style objects', () => {
		const json = JSON.stringify({
			country: { name: 'Australia' },
			TLC: { id: 9, name: 'Castle Hill' },
			parent: { id: 10, name: 'Goldmine' }
		});
		expect(parseAncestorsJson(json)?.map((a) => a.name)).toEqual([
			'Australia',
			'Castle Hill',
			'Goldmine'
		]);
	});
});

describe('sectorPathUnderCrag', () => {
	it('returns segments below the crag when ancestors exist', () => {
		const ancestorsJson = JSON.stringify([
			{ name: 'World' },
			{ name: 'Australia' },
			{ name: 'Castle Hill' },
			{ name: 'Goldmine' },
			{ name: 'Left Wall' }
		]);
		expect(
			sectorPathUnderCrag({
				ancestorsJson,
				cragName: 'Castle Hill',
				parentName: 'Goldmine'
			})
		).toEqual({ segments: ['Goldmine', 'Left Wall'], usedAncestors: true });
	});

	it('falls back to parentName when ancestors_json is empty', () => {
		expect(
			sectorPathUnderCrag({
				ancestorsJson: null,
				cragName: 'Castle Hill',
				parentName: 'Goldmine'
			})
		).toEqual({ segments: ['Goldmine'], usedAncestors: false });
	});
});

describe('pitches and flags helpers', () => {
	it('counts pitches and detects a single style flag', () => {
		expect(pitchCountFromJson(JSON.stringify([{ number: 1 }, { number: 2 }]))).toBe(2);
		expect(styleFromFlagsJson(JSON.stringify(['IsSport', 'Project']))).toBe('Sport');
		expect(gearStyleMismatch('Trad', JSON.stringify(['IsSport']))).toBe(true);
		expect(gearStyleMismatch('Sport', JSON.stringify(['IsSport']))).toBe(false);
	});
});

describe('sector tree rollup', () => {
	it('nests nodes and rolls up counts', () => {
		const root = new Map<string, SectorTreeNode>();
		insertSectorPath(root, ['Goldmine', 'Left Wall'], 1, 3, {
			multipitch: true,
			styleMismatch: false
		});
		insertSectorPath(root, ['Goldmine', 'Right Wall'], 2, 1, {
			multipitch: false,
			styleMismatch: true
		});
		const sectors = [...root.values()].map(treeNodeToSectorNode);
		expect(sectors).toHaveLength(1);
		expect(sectors[0]!.name).toBe('Goldmine');
		expect(sectors[0]!.routeCount).toBe(2);
		expect(sectors[0]!.ascentCount).toBe(4);
		expect(sectors[0]!.multipitchRouteCount).toBe(1);
		expect(sectors[0]!.children).toHaveLength(2);
		expect(sectorTreeHasDepth(sectors)).toBe(true);
	});

	it('ancestorAreaNames drops World', () => {
		expect(ancestorAreaNames([{ name: 'World' }, { name: 'Australia' }])).toEqual(['Australia']);
	});
});
