-- Add cost and revenue tracking fields to productions table
-- These fields are optional to reduce friction for users

ALTER TABLE public.productions
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selling_price_per_kg DECIMAL DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.productions.total_cost IS 'Total production cost (seeds, fertilizer, labor, etc.)';
COMMENT ON COLUMN public.productions.selling_price_per_kg IS 'Selling price per kilogram of harvest';
