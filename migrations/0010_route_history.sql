-- Public route-history cache + import progress for Settings → Import route history (#68).
-- FA/FFA marks still live in first_ascents; this stores the upstream history rows and
-- remembers routes the owner unmarked so a re-import does not silently re-add them.

ALTER TABLE first_ascents ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS route_history (
	provider TEXT NOT NULL,
	route_external_id TEXT NOT NULL,
	history_external_id TEXT NOT NULL,
	type TEXT NOT NULL,
	climbers TEXT,
	history_date TEXT,
	raw_json TEXT,
	updated_at TEXT NOT NULL,
	PRIMARY KEY (provider, route_external_id, history_external_id)
);

CREATE INDEX IF NOT EXISTS route_history_route_idx
	ON route_history (provider, route_external_id);

CREATE TABLE IF NOT EXISTS first_ascent_import_skips (
	provider TEXT NOT NULL,
	route_external_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (provider, route_external_id)
);

CREATE TABLE IF NOT EXISTS route_history_import_state (
	provider TEXT PRIMARY KEY,
	offset INTEGER NOT NULL DEFAULT 0,
	total INTEGER NOT NULL DEFAULT 0,
	fetched INTEGER NOT NULL DEFAULT 0,
	marked INTEGER NOT NULL DEFAULT 0,
	skipped INTEGER NOT NULL DEFAULT 0,
	errors INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'idle',
	last_error TEXT,
	updated_at TEXT NOT NULL
);
