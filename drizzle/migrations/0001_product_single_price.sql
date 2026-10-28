ALTER TABLE public.products ADD COLUMN single_price numeric(12,2);
ALTER TABLE public.products ADD CONSTRAINT products_single_price_positive CHECK (single_price IS NULL OR (single_price > 0 AND single_price <> 'NaN'::numeric));
COMMENT ON COLUMN public.products.single_price IS 'Optional independent single label price. No automatic backfill from payment prices.';