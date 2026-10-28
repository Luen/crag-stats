-- When ascent_count was last written from route-info (not other route_info fields).
ALTER TABLE routes ADD COLUMN ascent_count_fetched_at TEXT;
