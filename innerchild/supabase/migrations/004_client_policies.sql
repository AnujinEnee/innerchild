-- ============================================================
-- Migration 004 — Client (user) RLS policies
-- Run after migration 003.
-- ============================================================

-- Clients can cancel (update status) their own consultations
CREATE POLICY "clients update own consultations"
  ON consultations FOR UPDATE
  USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Clients can read their own submitted articles (by email)
CREATE POLICY "clients read own submitted articles"
  ON submitted_articles FOR SELECT
  USING (author_email = auth.email());

-- Public read for active content
CREATE POLICY "public read content"
  ON content FOR SELECT
  USING (active = true);
