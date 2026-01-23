-- Add donation support columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS record_type text NOT NULL DEFAULT 'sale',
ADD COLUMN IF NOT EXISTS reference_value numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recipient text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_total numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.sales.record_type IS 'Type of record: sale or donation';
COMMENT ON COLUMN public.sales.reference_value IS 'Reference value for donations (not counted as revenue)';
COMMENT ON COLUMN public.sales.recipient IS 'Recipient name for donations';
COMMENT ON COLUMN public.sales.notes IS 'Notes/reason for the record';
COMMENT ON COLUMN public.sales.cost_total IS 'Total cost of items (for donation cost tracking)';