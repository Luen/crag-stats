CREATE TABLE IF NOT EXISTS project_overrides (
    provider TEXT NOT NULL,
    route_external_id TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('include', 'exclude')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, route_external_id)
);
