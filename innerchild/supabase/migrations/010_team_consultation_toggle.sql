ALTER TABLE team_members ADD COLUMN IF NOT EXISTS online_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS offline_enabled boolean NOT NULL DEFAULT true;
