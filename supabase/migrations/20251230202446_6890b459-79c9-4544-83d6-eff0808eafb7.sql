-- Add packaging_discount column to products table
ALTER TABLE public.products
ADD COLUMN packaging_discount numeric NOT NULL DEFAULT 0;

-- Add a comment explaining the column
COMMENT ON COLUMN public.products.packaging_discount IS 'Discount on packaging/extras cost (in R$) for basket products';