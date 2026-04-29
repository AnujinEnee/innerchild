-- Add cancellation and refund bank details to consultations
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS refund_bank_name text,
  ADD COLUMN IF NOT EXISTS refund_account_holder text,
  ADD COLUMN IF NOT EXISTS refund_account_number text,
  ADD COLUMN IF NOT EXISTS refund_iban text;
