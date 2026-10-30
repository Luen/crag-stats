/**
 * DB-backed suggested goals for the Goals page (#252).
 */
import { eq } from 'drizzle-orm';
import {
	buildSuggestedOutdoorGradeGoals,
	type SuggestedGoalAscent,
	type SuggestedGradeGoal
} from '#lib/suggestedGoals';
import { getPreferredGradeSystem } from './appSettings';
import { db, ensureSchema } from './db';
import { ascents, routes } from './db/schema';
import { listGoals } from './goals';

export type { SuggestedGradeGoal } from '#lib/suggestedGoals';
export { buildSuggestedOutdoorGradeGoals, nextGradeStep } from '#lib/suggestedGoals';

function loadSuggestedAscentRows(): SuggestedGoalAscent[] {
	return db
		.select({
			ascentDate: ascents.ascentDate,
			isSend: ascents.isSend,
			effectiveGradeScore: ascents.effectiveGradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			routeName: routes.name,
			cragName: routes.cragName,
			tagsJson: routes.tagsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();
}

/** Live suggestions for the Goals page. */
export function listSuggestedGradeGoals(): SuggestedGradeGoal[] {
	ensureSchema();
	const goals = listGoals();
	return buildSuggestedOutdoorGradeGoals(loadSuggestedAscentRows(), {
		preferredSystem: getPreferredGradeSystem(),
		activeGoals: goals
	});
}
