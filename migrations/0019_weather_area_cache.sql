-- Separate from authoritative route coordinates and private logbook payloads.
CREATE TABLE IF NOT EXISTS weather_area_cache (
  provider TEXT NOT NULL,
  area_external_id TEXT NOT NULL,
  raw_json TEXT,
  fetched_at TEXT,
  PRIMARY KEY (provider, area_external_id)
);
