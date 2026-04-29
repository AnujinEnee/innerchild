-- Add price and slug columns to tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
