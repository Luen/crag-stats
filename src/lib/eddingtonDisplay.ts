import { DEFAULT_LOCALE, formatMessage, type SupportedLocale } from '#lib/i18n';
import type { EddingtonStats } from '#lib/types/dashboard';

export type EddingtonTile = {
	key: string;
	label: string;
	value: number;
	means: string;
	next: string;
};

/** Summary tiles shared by the dashboard card and /eddington page. */
export function eddingtonTiles(
	data: EddingtonStats,
	locale: SupportedLocale = DEFAULT_LOCALE
): EddingtonTile[] {
	const { sends, vertical, routeGrade, boulderGrade, verticalUnitM: unit } = data;
	return [
		{
			key: 'sends',
			label: formatMessage(locale, 'cards.eddington.labelSendDays'),
			value: sends.value,
			means: formatMessage(locale, 'cards.eddington.meansSendDays', {
				count: sends.value,
				value: sends.value
			}),
			next: formatMessage(locale, 'cards.eddington.nextSendDays', {
				needed: sends.needed,
				next: sends.next
			})
		},
		{
			key: 'vertical',
			label: formatMessage(locale, 'cards.eddington.labelVerticalDays'),
			value: vertical.value,
			means: formatMessage(locale, 'cards.eddington.meansVerticalDays', {
				count: vertical.value,
				metres: vertical.value * unit
			}),
			next: formatMessage(locale, 'cards.eddington.nextVerticalDays', {
				needed: vertical.needed,
				metres: vertical.next * unit,
				next: vertical.next
			})
		},
		{
			key: 'routeGrade',
			label: formatMessage(locale, 'cards.eddington.labelRouteGrade'),
			value: routeGrade.value,
			means: formatMessage(locale, 'cards.eddington.meansRouteGrade', {
				count: routeGrade.value,
				value: routeGrade.value
			}),
			next: formatMessage(locale, 'cards.eddington.nextRouteGrade', {
				needed: routeGrade.needed,
				next: routeGrade.next
			})
		},
		{
			key: 'boulderGrade',
			label: formatMessage(locale, 'cards.eddington.labelBoulderGrade'),
			value: boulderGrade.value,
			means: formatMessage(locale, 'cards.eddington.meansBoulderGrade', {
				count: boulderGrade.value,
				value: boulderGrade.value
			}),
			next: formatMessage(locale, 'cards.eddington.nextBoulderGrade', {
				needed: boulderGrade.needed,
				next: boulderGrade.next
			})
		}
	];
}
