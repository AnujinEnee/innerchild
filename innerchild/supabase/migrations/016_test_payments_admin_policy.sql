-- Allow admins to read/write all test_payments rows.
-- Without this, RLS on test_payments only lets users see their own rows,
-- so admin dashboards (e.g. /admin/tests) show 0 payments / 0 revenue.

DROP POLICY IF EXISTS "admin all test_payments" ON test_payments;
CREATE POLICY "admin all test_payments"
  ON test_payments FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
