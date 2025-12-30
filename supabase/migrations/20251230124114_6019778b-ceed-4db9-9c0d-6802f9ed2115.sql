-- Add price columns for different payment methods
ALTER TABLE public.products 
ADD COLUMN price_pix numeric NOT NULL DEFAULT 0,
ADD COLUMN price_card numeric NOT NULL DEFAULT 0;

-- Migrate existing products: copy sale_price to both price columns
UPDATE public.products 
SET price_pix = sale_price, 
    price_card = sale_price 
WHERE price_pix = 0 AND price_card = 0;