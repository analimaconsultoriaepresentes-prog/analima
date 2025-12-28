-- Add basket-related fields to products table
ALTER TABLE public.products 
ADD COLUMN is_basket boolean NOT NULL DEFAULT false,
ADD COLUMN packaging_cost numeric NOT NULL DEFAULT 0;

-- Create table for basket composition (items that make up a basket)
CREATE TABLE public.basket_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  basket_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT basket_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT basket_items_unique UNIQUE (basket_id, product_id)
);

-- Enable RLS on basket_items
ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for basket_items (based on basket ownership)
CREATE POLICY "Users can view own basket items" 
ON public.basket_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = basket_items.basket_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can insert own basket items" 
ON public.basket_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = basket_items.basket_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can update own basket items" 
ON public.basket_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = basket_items.basket_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can delete own basket items" 
ON public.basket_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = basket_items.basket_id 
  AND products.user_id = auth.uid()
));