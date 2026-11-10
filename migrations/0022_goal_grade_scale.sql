-- A numeric goal score is ambiguous without its route or boulder scale.
-- Existing goals stay unknown until the owner chooses; never guess from their titles.
ALTER TABLE goals ADD COLUMN grade_scale TEXT;
ALTER TABLE goals ADD COLUMN suggested INTEGER NOT NULL DEFAULT 0;
