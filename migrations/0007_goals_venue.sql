-- Goals: indoor/outdoor scope + achieved timestamp for Achieved shelf
ALTER TABLE goals ADD COLUMN venue_scope TEXT NOT NULL DEFAULT 'any';
ALTER TABLE goals ADD COLUMN achieved_at TEXT;
