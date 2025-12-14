/*
  # Add Co-Owners Support to Sales Table

  1. Changes:
     - Adds co_owners column to sales table
     - Column type: JSONB (stores array of co-owner/co-applicant data)
     - Default value: empty array
  
  2. Purpose:
     - Enables tracking of multiple owners/co-applicants for a single sale
     - Stores co-owner information in flexible JSON format
     - Supports complex ownership scenarios
  
  3. Security:
     - Inherits existing RLS policies from sales table
     - No additional permissions changes needed
*/

-- Add co_owners column to sales table to support multiple owners
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS co_owners JSONB DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN sales.co_owners IS 'List of additional owners/co-applicants for the sale';
