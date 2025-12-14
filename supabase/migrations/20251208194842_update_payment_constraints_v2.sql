/*
  # Update Payment Constraints

  ## Changes Made
  
  ### Payments Table Constraint Updates
  
  #### Payment Type Constraint
  - Updated allowed values to: 'emi', 'advance', 'booking', 'token', 'loan_disbursement', 'other'
  - Removed: 'installment', 'full_payment'
  - Added: 'emi', 'advance'
  
  #### Payment Mode Constraint
  - Updated allowed values to: 'cash', 'cheque', 'account_transfer', 'upi', 'dd', 'other'
  - Changed: 'bank_transfer' to 'account_transfer'
*/

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
  CHECK (payment_type IN ('emi', 'advance', 'booking', 'token', 'loan_disbursement', 'other'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
  CHECK (payment_mode IN ('cash', 'cheque', 'account_transfer', 'upi', 'dd', 'other'));