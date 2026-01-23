-- Add prove_qty column to products table for sample/demonstration tracking
ALTER TABLE public.products 
ADD COLUMN prove_qty integer NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.products.prove_qty IS 'Quantity reserved for samples/demonstrations (PROVE). Available stock = stock - prove_qty';