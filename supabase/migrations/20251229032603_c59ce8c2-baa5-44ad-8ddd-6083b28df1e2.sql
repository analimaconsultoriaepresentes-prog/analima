-- Add archiving columns to products table
ALTER TABLE public.products 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN deleted_at TIMESTAMPTZ NULL;

-- Create index for filtering active products
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- Update existing products to be active
UPDATE public.products SET is_active = true WHERE is_active IS NULL;