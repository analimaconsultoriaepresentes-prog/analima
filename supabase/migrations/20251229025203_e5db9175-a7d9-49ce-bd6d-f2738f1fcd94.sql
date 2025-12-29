-- Add channel column to sales table
ALTER TABLE public.sales 
ADD COLUMN channel TEXT NOT NULL DEFAULT 'store';

-- Add comment for documentation
COMMENT ON COLUMN public.sales.channel IS 'Sales channel: store (physical store) or online (WhatsApp/Instagram)';