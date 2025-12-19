-- Remove the foreign key constraint on sale_id
-- This allows us to create "Manual Incentives" that don't correspond to a real sale record in the sales table.

ALTER TABLE public.incentives DROP CONSTRAINT IF EXISTS incentives_sale_id_fkey;
