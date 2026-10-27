-- CPR shifted/decayed snapshots + attempt counts from theCrag API
ALTER TABLE ascents ADD COLUMN number_attempts INTEGER;
ALTER TABLE ascents ADD COLUMN cpr_shifted_score REAL;
ALTER TABLE ascents ADD COLUMN cpr_shifted_grade TEXT;
ALTER TABLE ascents ADD COLUMN cpr_decayed_score REAL;
ALTER TABLE ascents ADD COLUMN cpr_decayed_grade TEXT;

-- Route coordinates for crag map (from route / ancestor geometry)
ALTER TABLE routes ADD COLUMN lat REAL;
ALTER TABLE routes ADD COLUMN lon REAL;
