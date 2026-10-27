-- Routes the owner marked as their first ascent (FA) or first free ascent (FFA).
-- theCrag keeps FAs in route history, which the logbook API doesn't return, so this is
-- local data. Keyed by the provider's route id so marks survive re-syncs and route prunes.
CREATE TABLE IF NOT EXISTS first_ascents (
	provider TEXT NOT NULL,
	route_external_id TEXT NOT NULL,
	kind TEXT NOT NULL DEFAULT 'FA',
	created_at TEXT NOT NULL,
	PRIMARY KEY (provider, route_external_id)
);
