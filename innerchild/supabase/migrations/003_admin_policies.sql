-- ============================================================
-- Migration 003 — Admin RLS policies
-- ============================================================
-- Run migration 001 and 002 first, then run this.
--
-- HOW TO BOOTSTRAP:
--   1. Run this SQL in Supabase Dashboard → SQL Editor.
--   2. In Table Editor → admin_users, insert a row with
--      your admin email (use service role / dashboard).
--   3. Sign in on /admin/login with that email.
-- ============================================================

-- ─── Helper function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE email = auth.email()
  );
$$;

-- ─── Policies for tables from migration 001 ──────────────────

CREATE POLICY "admin all team_members"
  ON team_members FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all work_tasks"
  ON work_tasks FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all users"
  ON users FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all consultations"
  ON consultations FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all test_results"
  ON test_results FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all tests"
  ON tests FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all articles"
  ON articles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all submitted_articles"
  ON submitted_articles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all newsletter"
  ON newsletter_subscriptions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin read admin_users"
  ON admin_users FOR SELECT
  USING (is_admin());

-- ─── Policies for tables from migration 002 ──────────────────
-- These tables are created in 002_missing_tables.sql.
-- If 002 has not been run yet, run it first, then run the
-- block below separately.

CREATE POLICY "admin all test_questions"
  ON test_questions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all test_question_options"
  ON test_question_options FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all test_answers"
  ON test_answers FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all salary_records"
  ON salary_records FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin all content"
  ON content FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
