/**
 * Order earned badges newest climb first for the dashboard rail and /badges gallery.
 * Pure — no DB. Badges keep their catalog order within one day.
 */
import { calendarDay } from '#lib/calendarDay';

/** Badges dated by something other than a climb (First Moves = import time). */
const NON_CLIMB_DATED = new Set(['first_moves']);

type Orderable = { id: string; date: string | null };

/** Calendar day (`YYYY-MM-DD`) of a badge's earning climb, or null when it has none. */
function climbDay(badge: Orderable): string | null {
	return NON_CLIMB_DATED.has(badge.id) ? null : calendarDay(badge.date);
}

/**
 * Most recent climb day first; same-day badges keep catalog order. Badges without a
 * climb day (First Moves, community estimates) follow, also in catalog order.
 */
export function sortEarnedBadges<T extends Orderable>(earned: readonly T[]): T[] {
	return earned
		.map((badge, index) => ({ badge, index, day: climbDay(badge) }))
		.sort((a, b) => {
			if (a.day && b.day) {
				const byDay = b.day.localeCompare(a.day);
				if (byDay !== 0) return byDay;
			} else if (a.day || b.day) {
				return a.day ? -1 : 1;
			}
			return a.index - b.index;
		})
		.map((x) => x.badge);
}
