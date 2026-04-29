-- Enable Row-Level Security on test_payments (was created without RLS in 012).
-- Safe to re-run: uses idempotent guards.

ALTER TABLE test_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS test_payments_select_own ON test_payments;
CREATE POLICY test_payments_select_own ON test_payments
  FOR SELECT
  USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS test_payments_insert_own ON test_payments;
CREATE POLICY test_payments_insert_own ON test_payments
  FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
