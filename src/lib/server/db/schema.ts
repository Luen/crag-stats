import {
	sqliteTable,
	text,
	integer,
	real,
	uniqueIndex,
	index,
	primaryKey
} from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	provider: text('provider').notNull().default('thecrag'),
	externalId: text('external_id'),
	name: text('name'),
	login: text('login'),
	country: text('country'),
	ascentCount: integer('ascent_count'),
	avatar: text('avatar'),
	typeOfClimber: text('type_of_climber'),
	outdoorAscentCount: integer('outdoor_ascent_count'),
	indoorAscentCount: integer('indoor_ascent_count'),
	heightClimbed: real('height_climbed'),
	routesTicked: integer('routes_ticked'),
	rawJson: text('raw_json'),
	updatedAt: text('updated_at').notNull()
});

export const routes = sqliteTable(
	'routes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		provider: text('provider').notNull(),
		externalId: text('external_id').notNull(),
		name: text('name').notNull(),
		gradeRaw: text('grade_raw'),
		gradeScore: real('grade_score'),
		gradeBand: integer('grade_band'),
		gradeSystem: text('grade_system'),
		gearStyle: text('gear_style'),
		heightM: real('height_m'),
		stars: integer('stars'),
		url: text('url'),
		country: text('country'),
		cragName: text('crag_name'),
		cragPath: text('crag_path'),
		/** Public theCrag area/crag page for cragName (TLC) */
		cragUrl: text('crag_url'),
		areaExternalId: text('area_external_id'),
		/** JSON array of {category,name} from route.tags */
		tagsJson: text('tags_json'),
		bolts: integer('bolts'),
		parentName: text('parent_name'),
		parentExternalId: text('parent_external_id'),
		lat: real('lat'),
		lon: real('lon'),
		updatedAt: text('updated_at').notNull()
	},
	(t) => [uniqueIndex('routes_provider_ext').on(t.provider, t.externalId)]
);

export const ascents = sqliteTable(
	'ascents',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		provider: text('provider').notNull(),
		externalId: text('external_id').notNull(),
		routeId: integer('route_id')
			.notNull()
			.references(() => routes.id),
		ascentDate: text('ascent_date'),
		logDate: text('log_date'),
		tickType: text('tick_type'),
		tickLabel: text('tick_label'),
		ascentGearStyle: text('ascent_gear_style'),
		ascentGradeRaw: text('ascent_grade_raw'),
		/** Grade for *this* ascent (climbed pitches / CPR), not always the full route grade */
		effectiveGradeRaw: text('effective_grade_raw'),
		effectiveGradeScore: real('effective_grade_score'),
		effectiveGradeBand: integer('effective_grade_band'),
		/** e.g. P1 or P1–P2 when multipitch logging was used */
		pitchLabel: text('pitch_label'),
		/** theCrag ascent `label` when set (often route name or "Neon God P1") */
		ascentLabel: text('ascent_label'),
		pitchesClimbed: integer('pitches_climbed'),
		pitchesTotal: integer('pitches_total'),
		heightM: real('height_m'),
		quality: text('quality'),
		partners: text('partners'),
		comment: text('comment'),
		isSend: integer('is_send', { mode: 'boolean' }).notNull().default(false),
		isAttempt: integer('is_attempt', { mode: 'boolean' }).notNull().default(false),
		epoch: integer('epoch'),
		numberAttempts: integer('number_attempts'),
		cprBase: text('cpr_base'),
		cprScore: real('cpr_score'),
		cprShiftedScore: real('cpr_shifted_score'),
		cprShiftedGrade: text('cpr_shifted_grade'),
		cprDecayedScore: real('cpr_decayed_score'),
		cprDecayedGrade: text('cpr_decayed_grade'),
		/** Public theCrag ascent page (/ascent/{external_id}) */
		ascentUrl: text('ascent_url'),
		rawJson: text('raw_json'),
		updatedAt: text('updated_at').notNull()
	},
	(t) => [
		uniqueIndex('ascents_provider_ext').on(t.provider, t.externalId),
		index('ascents_date_idx').on(t.ascentDate),
		index('ascents_tick_idx').on(t.tickType),
		index('ascents_route_idx').on(t.routeId)
	]
);

export const syncState = sqliteTable(
	'sync_state',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		provider: text('provider').notNull(),
		cursor: text('cursor'),
		lastSyncAt: text('last_sync_at'),
		lastSuccessAt: text('last_success_at'),
		lastError: text('last_error'),
		status: text('status').notNull().default('idle')
	},
	(t) => [uniqueIndex('sync_provider').on(t.provider)]
);

export const projects = sqliteTable(
	'projects',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		routeId: integer('route_id')
			.notNull()
			.references(() => routes.id),
		status: text('status').notNull().default('open'), // open | sent | archived
		attemptCount: integer('attempt_count').notNull().default(0),
		firstAttemptAt: text('first_attempt_at'),
		lastAttemptAt: text('last_attempt_at'),
		sentAt: text('sent_at'),
		notes: text('notes'),
		updatedAt: text('updated_at').notNull()
	},
	(t) => [uniqueIndex('projects_route').on(t.routeId)]
);

export const goals = sqliteTable('goals', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kind: text('kind').notNull(), // grade | height_year | days_month | custom
	title: text('title').notNull(),
	targetValue: text('target_value'),
	targetGradeScore: real('target_grade_score'),
	year: integer('year'),
	progressValue: text('progress_value'),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	/** outdoor | indoor | any — filters auto progress from logbook */
	venueScope: text('venue_scope').notNull().default('any'),
	achievedAt: text('achieved_at'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export type Route = typeof routes.$inferSelect;
export type Ascent = typeof ascents.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type SyncState = typeof syncState.$inferSelect;

/** Site-wide key/value preferences edited in /settings. */
export const appSettings = sqliteTable('app_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updatedAt: text('updated_at').notNull()
});

/** Owner-marked first ascents (migration 0009); optional import from route history (#68). */
export const firstAscents = sqliteTable(
	'first_ascents',
	{
		provider: text('provider').notNull(),
		routeExternalId: text('route_external_id').notNull(),
		/** FA | FFA */
		kind: text('kind').notNull().default('FA'),
		createdAt: text('created_at').notNull(),
		/** manual | import — migration 0010 */
		source: text('source').notNull().default('manual')
	},
	(t) => [primaryKey({ columns: [t.provider, t.routeExternalId] })]
);

/** Cached public history rows from `/api/route/…?show=info` (migration 0010). */
export const routeHistory = sqliteTable(
	'route_history',
	{
		provider: text('provider').notNull(),
		routeExternalId: text('route_external_id').notNull(),
		historyExternalId: text('history_external_id').notNull(),
		type: text('type').notNull(),
		climbers: text('climbers'),
		historyDate: text('history_date'),
		rawJson: text('raw_json'),
		updatedAt: text('updated_at').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.provider, t.routeExternalId, t.historyExternalId] }),
		index('route_history_route_idx').on(t.provider, t.routeExternalId)
	]
);

/** Routes the owner unmarked; import skips these unless reapply is set (migration 0010). */
export const firstAscentImportSkips = sqliteTable(
	'first_ascent_import_skips',
	{
		provider: text('provider').notNull(),
		routeExternalId: text('route_external_id').notNull(),
		createdAt: text('created_at').notNull()
	},
	(t) => [primaryKey({ columns: [t.provider, t.routeExternalId] })]
);

/** Resumable Settings → Import route history progress (migration 0010). */
export const routeHistoryImportState = sqliteTable('route_history_import_state', {
	provider: text('provider').primaryKey(),
	offset: integer('offset').notNull().default(0),
	total: integer('total').notNull().default(0),
	fetched: integer('fetched').notNull().default(0),
	marked: integer('marked').notNull().default(0),
	skipped: integer('skipped').notNull().default(0),
	errors: integer('errors').notNull().default(0),
	status: text('status').notNull().default('idle'),
	lastError: text('last_error'),
	updatedAt: text('updated_at').notNull()
});
