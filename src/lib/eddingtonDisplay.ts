import type { EddingtonStats } from '#lib/types/dashboard';

export type EddingtonTile = {
	key: string;
	label: string;
	value: number;
	means: string;
	next: string;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Summary tiles shared by the dashboard card and /eddington page. */
export function eddingtonTiles(data: EddingtonStats): EddingtonTile[] {
	const { sends, vertical, routeGrade, boulderGrade, verticalUnitM: unit } = data;
	return [
		{
			key: 'sends',
			label: 'Send days',
			value: sends.value,
			means: `${plural(sends.value, 'day')} with ${sends.value}+ sends`,
			next: `${plural(sends.needed, 'more day')} of ${sends.next}+ sends for ${sends.next}`
		},
		{
			key: 'vertical',
			label: 'Vertical days',
			value: vertical.value,
			means: `${plural(vertical.value, 'day')} with ${vertical.value * unit}+ m climbed`,
			next: `${plural(vertical.needed, 'more day')} of ${vertical.next * unit}+ m for ${vertical.next}`
		},
		{
			key: 'routeGrade',
			label: 'Route grade index',
			value: routeGrade.value,
			means: `${plural(routeGrade.value, 'route')} sent at Ewbank ${routeGrade.value}+`,
			next: `${plural(routeGrade.needed, 'more route')} at ${routeGrade.next}+ for ${routeGrade.next}`
		},
		{
			key: 'boulderGrade',
			label: 'Boulder grade index',
			value: boulderGrade.value,
			means: `${plural(boulderGrade.value, 'problem')} sent at V${boulderGrade.value}+`,
			next: `${plural(boulderGrade.needed, 'more problem')} at V${boulderGrade.next}+ for ${boulderGrade.next}`
		}
	];
}
