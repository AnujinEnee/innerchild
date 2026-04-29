-- Allow admins to read/write all test_payments rows.
-- Without this, RLS on test_payments only lets users see their own rows,
-- so admin dashboards (e.g. /admin/tests) show 0 payments / 0 revenue.

-- Recreate is_admin() in case the original 003 migration was never applied.
-- Idempotent: safe to run even if the function already exists.
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

DROP POLICY IF EXISTS "admin all test_payments" ON test_payments;
CREATE POLICY "admin all test_payments"
  ON test_payments FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
