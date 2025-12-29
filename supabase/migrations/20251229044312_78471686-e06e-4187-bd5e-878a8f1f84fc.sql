-- Add product_type column to products table
-- Values: 'item' (default), 'packaging', 'extra', 'basket'
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'item';

-- Create basket_extras table to store extras for each basket
CREATE TABLE IF NOT EXISTS public.basket_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  basket_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  extra_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add packaging reference to products (for baskets)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS packaging_product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS packaging_qty INTEGER NOT NULL DEFAULT 1;

-- Enable RLS on basket_extras
ALTER TABLE public.basket_extras ENABLE ROW LEVEL SECURITY;

-- RLS policies for basket_extras (based on basket ownership)
CREATE POLICY "Users can view own basket extras" 
ON public.basket_extras 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = basket_extras.basket_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can insert own basket extras" 
ON public.basket_extras 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = basket_extras.basket_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can update own basket extras" 
ON public.basket_extras 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = basket_extras.basket_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can delete own basket extras" 
ON public.basket_extras 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = basket_extras.basket_id 
  AND products.user_id = auth.uid()
));

-- Update existing baskets to have product_type = 'basket'
UPDATE public.products SET product_type = 'basket' WHERE is_basket = true;