CREATE TABLE weather_locations (
 route_id INTEGER PRIMARY KEY REFERENCES routes(id) ON DELETE CASCADE,
 signature TEXT NOT NULL,
 location_json TEXT,
 resolved_at TEXT NOT NULL
);
CREATE TABLE weather_place_overrides (
 area_key TEXT PRIMARY KEY,
 location_json TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE weather_place_searches (
 query_key TEXT PRIMARY KEY,
 results_json TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 next_allowed_at INTEGER NOT NULL,
 error TEXT
);
