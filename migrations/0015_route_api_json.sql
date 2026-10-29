-- Full last-successful `/api/route` object so future features can mine fields we did
-- not columnize yet without re-fetching under pacing/back-off (#197).
ALTER TABLE routes ADD COLUMN route_api_json TEXT;
