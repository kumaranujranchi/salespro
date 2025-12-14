-- Add co_owners column to sales table to support multiple owners
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS co_owners JSONB DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN sales.co_owners IS 'List of additional owners/co-applicants for the sale';
