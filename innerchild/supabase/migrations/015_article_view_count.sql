-- Track how many times each article has been viewed.
-- Bumped at most once per IP/browser per 24h via cookie dedup in /api/articles/[id]/view.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
