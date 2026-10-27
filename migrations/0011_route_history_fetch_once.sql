-- Upgrade DBs that applied the first draft of 0010 (offset/total progress cursor)
-- to the fetch-once shape used by routeHistoryEngine.ts. Fresh installs that already
-- got the rewritten 0010 still run this safely: CREATE IF NOT EXISTS + table rebuild.

CREATE TABLE IF NOT EXISTS route_history_fetches (
	provider TEXT NOT NULL,
	route_external_id TEXT NOT NULL,
	status TEXT NOT NULL,
	history_count INTEGER NOT NULL DEFAULT 0,
	fetched_at TEXT NOT NULL,
	PRIMARY KEY (provider, route_external_id)
);

CREATE TABLE route_history_import_state_new (
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

-- Copy whatever is shared with both the draft and rewritten 0010 shapes.
INSERT INTO route_history_import_state_new (provider, status, last_error, updated_at)
SELECT provider, status, last_error, updated_at FROM route_history_import_state;

DROP TABLE route_history_import_state;
ALTER TABLE route_history_import_state_new RENAME TO route_history_import_state;
