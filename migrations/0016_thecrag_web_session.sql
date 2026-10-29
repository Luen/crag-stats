-- Credentials stay in the environment. Cookie jars are encrypted with SESSION_SECRET.
CREATE TABLE IF NOT EXISTS thecrag_web_sessions (
  account_key TEXT PRIMARY KEY NOT NULL,
  encrypted_cookies TEXT NOT NULL,
  next_allowed_at INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0
);
