/*
  # Update Payment Constraints
  
  Update allowed values for payment_type and payment_mode to match the specific user requirements.
  
  New Payment Types: 'emi', 'advance', 'booking', 'token', 'loan_disbursement'
  New Payment Modes: 'cash', 'cheque', 'account_transfer', 'upi', 'dd'
*/

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
  CHECK (payment_type IN ('emi', 'advance', 'booking', 'token', 'loan_disbursement', 'other'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
  CHECK (payment_mode IN ('cash', 'cheque', 'account_transfer', 'upi', 'dd', 'other'));
