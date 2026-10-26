-- Per-ascent effective grade (multipitch / CPR-adjusted) + pitch summary
ALTER TABLE ascents ADD COLUMN effective_grade_raw TEXT;
ALTER TABLE ascents ADD COLUMN effective_grade_score REAL;
ALTER TABLE ascents ADD COLUMN effective_grade_band INTEGER;
ALTER TABLE ascents ADD COLUMN pitch_label TEXT;
ALTER TABLE ascents ADD COLUMN pitches_climbed INTEGER;
ALTER TABLE ascents ADD COLUMN pitches_total INTEGER;
