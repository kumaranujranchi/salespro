/*
  # Add Driver Role
  
  1. Changes
    - Update `profiles` table `role` check constraint to include 'driver'.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'team_leader', 'sales_executive', 'crm_staff', 'accountant', 'driver'));
