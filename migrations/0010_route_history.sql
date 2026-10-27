-- Public route-history cache for first ascents (#68). Opt-in via ROUTE_HISTORY_IMPORT.
-- FA/FFA marks still live in first_ascents; this stores upstream history rows, which routes
-- have been fetched (FA/FFA history never changes, so each route is fetched once), routes
-- the owner unmarked, and the state of the rate-limited background import.

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

-- One row per route once theCrag answered for it: status 'ok' (history stored, possibly
-- empty) or 'missing' (not returned). Routes listed here are never fetched again unless the
-- owner chooses "Refresh all".
CREATE TABLE IF NOT EXISTS route_history_fetches (
	provider TEXT NOT NULL,
	route_external_id TEXT NOT NULL,
	status TEXT NOT NULL,
	history_count INTEGER NOT NULL DEFAULT 0,
	fetched_at TEXT NOT NULL,
	PRIMARY KEY (provider, route_external_id)
);

CREATE TABLE IF NOT EXISTS first_ascent_import_skips (
	provider TEXT NOT NULL,
	route_external_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (provider, route_external_id)
);

-- Last run of the background import, plus back-off after errors or blocks.
CREATE TABLE IF NOT EXISTS route_history_import_state (
	provider TEXT PRIMARY KEY,
	status TEXT NOT NULL DEFAULT 'idle',
	last_run_at TEXT,
	last_fetched INTEGER NOT NULL DEFAULT 0,
	last_marked INTEGER NOT NULL DEFAULT 0,
	last_error TEXT,
	consecutive_failures INTEGER NOT NULL DEFAULT 0,
	next_allowed_at TEXT,
	updated_at TEXT NOT NULL
);
