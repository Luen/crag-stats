-- Automatic CSV logbook downloads were removed at theCrag's request (programmatic access
-- must use the API). Drop the encrypted website session cookies they stored.
DROP TABLE IF EXISTS thecrag_web_sessions;
