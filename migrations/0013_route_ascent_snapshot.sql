-- Pair a cached route total with the owner's count from the same fetch.
-- Existing totals have no historical owner snapshot and must be refreshed.
ALTER TABLE routes ADD COLUMN ascent_count_own INTEGER;
