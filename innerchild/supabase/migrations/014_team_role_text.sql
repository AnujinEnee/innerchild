-- Convert team_members.role from team_role enum to free-form TEXT.
-- Existing values ('psychologist', 'therapist') are preserved as plain strings.

ALTER TABLE team_members
  ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- Drop the now-unused enum type. Safe because no other column references it.
DROP TYPE IF EXISTS team_role;
