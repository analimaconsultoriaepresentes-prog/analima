-- Add origin column to products table
ALTER TABLE public.products 
ADD COLUMN origin text NOT NULL DEFAULT 'purchased';

-- Add check constraint for valid values
ALTER TABLE public.products 
ADD CONSTRAINT products_origin_check CHECK (origin IN ('purchased', 'gift'));

-- Update existing products to 'purchased' (already default, but explicit)
UPDATE public.products SET origin = 'purchased' WHERE origin IS NULL;