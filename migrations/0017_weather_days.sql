-- Opt-in Open-Meteo daily weather cache (#268). Round lat/lon to 1 decimal so nearby
-- routes at one crag share a row. Wipe clears this with the rest of the local cache.
CREATE TABLE IF NOT EXISTS weather_days (
  lat_key REAL NOT NULL,
  lon_key REAL NOT NULL,
  day TEXT NOT NULL,
  temp_max_c REAL,
  temp_min_c REAL,
  precip_mm REAL,
  weather_code INTEGER,
  humidity_mean REAL,
  source TEXT NOT NULL DEFAULT 'open-meteo',
  status TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (lat_key, lon_key, day)
);

CREATE INDEX IF NOT EXISTS weather_days_day_idx ON weather_days (day);

CREATE TABLE IF NOT EXISTS weather_import_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  status TEXT NOT NULL DEFAULT 'idle',
  last_run_at TEXT,
  last_fetched INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  next_allowed_at TEXT,
  updated_at TEXT NOT NULL
);
