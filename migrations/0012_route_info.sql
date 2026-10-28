-- Route-level fields from `/api/route` during opt-in history import (#77–#82).
-- Populated on successful fetch; UI reads these in follow-up work.

ALTER TABLE routes ADD COLUMN is_project INTEGER;
ALTER TABLE routes ADD COLUMN quality_score REAL;
ALTER TABLE routes ADD COLUMN ascent_count INTEGER;
ALTER TABLE routes ADD COLUMN popularity REAL;
ALTER TABLE routes ADD COLUMN relative_popularity REAL;
ALTER TABLE routes ADD COLUMN seasonality_json TEXT;
ALTER TABLE routes ADD COLUMN beta_json TEXT;
ALTER TABLE routes ADD COLUMN ancestors_json TEXT;
ALTER TABLE routes ADD COLUMN pitches_json TEXT;
ALTER TABLE routes ADD COLUMN flags_json TEXT;
ALTER TABLE routes ADD COLUMN route_info_updated_at TEXT;
