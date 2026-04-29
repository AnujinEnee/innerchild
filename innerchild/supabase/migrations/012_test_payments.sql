CREATE TABLE IF NOT EXISTS test_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  test_slug TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_id TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE test_payments ENABLE ROW LEVEL SECURITY;

-- A client can read only their own payments
CREATE POLICY test_payments_select_own ON test_payments
  FOR SELECT
  USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- A client can insert a payment for themselves
CREATE POLICY test_payments_insert_own ON test_payments
  FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Admin (service_role) bypasses RLS automatically; no explicit policy needed.
