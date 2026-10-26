-- Initial Crag Stats schema
CREATE TABLE IF NOT EXISTS schema_migrations (
	id TEXT PRIMARY KEY,
	applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	provider TEXT NOT NULL DEFAULT 'thecrag',
	external_id TEXT,
	name TEXT,
	login TEXT,
	country TEXT,
	ascent_count INTEGER,
	raw_json TEXT,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	provider TEXT NOT NULL,
	external_id TEXT NOT NULL,
	name TEXT NOT NULL,
	grade_raw TEXT,
	grade_score REAL,
	grade_band INTEGER,
	grade_system TEXT,
	gear_style TEXT,
	height_m REAL,
	stars INTEGER,
	url TEXT,
	country TEXT,
	crag_name TEXT,
	crag_path TEXT,
	area_external_id TEXT,
	updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS routes_provider_ext ON routes(provider, external_id);

CREATE TABLE IF NOT EXISTS ascents (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	provider TEXT NOT NULL,
	external_id TEXT NOT NULL,
	route_id INTEGER NOT NULL REFERENCES routes(id),
	ascent_date TEXT,
	log_date TEXT,
	tick_type TEXT,
	tick_label TEXT,
	ascent_gear_style TEXT,
	ascent_grade_raw TEXT,
	height_m REAL,
	quality TEXT,
	partners TEXT,
	comment TEXT,
	is_send INTEGER NOT NULL DEFAULT 0,
	is_attempt INTEGER NOT NULL DEFAULT 0,
	epoch INTEGER,
	cpr_base TEXT,
	cpr_score REAL,
	raw_json TEXT,
	updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ascents_provider_ext ON ascents(provider, external_id);
CREATE INDEX IF NOT EXISTS ascents_date_idx ON ascents(ascent_date);
CREATE INDEX IF NOT EXISTS ascents_tick_idx ON ascents(tick_type);
CREATE INDEX IF NOT EXISTS ascents_route_idx ON ascents(route_id);

CREATE TABLE IF NOT EXISTS sync_state (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	provider TEXT NOT NULL,
	cursor TEXT,
	last_sync_at TEXT,
	last_success_at TEXT,
	last_error TEXT,
	status TEXT NOT NULL DEFAULT 'idle'
);
CREATE UNIQUE INDEX IF NOT EXISTS sync_provider ON sync_state(provider);

CREATE TABLE IF NOT EXISTS projects (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	route_id INTEGER NOT NULL REFERENCES routes(id),
	status TEXT NOT NULL DEFAULT 'open',
	attempt_count INTEGER NOT NULL DEFAULT 0,
	first_attempt_at TEXT,
	last_attempt_at TEXT,
	sent_at TEXT,
	notes TEXT,
	updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS projects_route ON projects(route_id);

CREATE TABLE IF NOT EXISTS goals (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	kind TEXT NOT NULL,
	title TEXT NOT NULL,
	target_value TEXT,
	target_grade_score REAL,
	year INTEGER,
	progress_value TEXT,
	completed INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
