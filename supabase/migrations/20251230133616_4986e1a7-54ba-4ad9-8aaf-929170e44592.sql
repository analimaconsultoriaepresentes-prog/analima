-- Add gift_type column for display purposes on composite products (baskets/kits)
ALTER TABLE public.products 
ADD COLUMN gift_type text NULL;

-- Add a comment to clarify this is for display only
COMMENT ON COLUMN public.products.gift_type IS 'Display-only field for basket/kit presentation: presente, cesta, kit, mini_presente, lembrancinha';