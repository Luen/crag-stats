-- Ascent display label (theCrag `label`, e.g. Neon God P1)
ALTER TABLE ascents ADD COLUMN ascent_label TEXT;

-- Route tags JSON: [{category,name}, ...] from route.tags
ALTER TABLE routes ADD COLUMN tags_json TEXT;
ALTER TABLE routes ADD COLUMN bolts INTEGER;
ALTER TABLE routes ADD COLUMN parent_name TEXT;
ALTER TABLE routes ADD COLUMN parent_external_id TEXT;

-- Account summary fields from API data.account
ALTER TABLE profiles ADD COLUMN avatar TEXT;
ALTER TABLE profiles ADD COLUMN type_of_climber TEXT;
ALTER TABLE profiles ADD COLUMN outdoor_ascent_count INTEGER;
ALTER TABLE profiles ADD COLUMN indoor_ascent_count INTEGER;
ALTER TABLE profiles ADD COLUMN height_climbed REAL;
ALTER TABLE profiles ADD COLUMN routes_ticked INTEGER;
