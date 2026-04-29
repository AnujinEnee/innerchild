ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_transaction_id text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_invoice_id text;
