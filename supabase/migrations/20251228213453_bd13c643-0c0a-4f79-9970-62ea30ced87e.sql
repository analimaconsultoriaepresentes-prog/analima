-- Create table to track basket component deductions for each sale
CREATE TABLE public.sale_basket_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES public.products(id),
  component_product_name TEXT NOT NULL,
  quantity_deducted INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_basket_components ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own sale basket components"
ON public.sale_basket_components
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sales
  WHERE sales.id = sale_basket_components.sale_id
  AND sales.user_id = auth.uid()
));

CREATE POLICY "Users can insert own sale basket components"
ON public.sale_basket_components
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sales
  WHERE sales.id = sale_basket_components.sale_id
  AND sales.user_id = auth.uid()
));

CREATE POLICY "Users can delete own sale basket components"
ON public.sale_basket_components
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM sales
  WHERE sales.id = sale_basket_components.sale_id
  AND sales.user_id = auth.uid()
));

-- Create index for performance
CREATE INDEX idx_sale_basket_components_sale_id ON public.sale_basket_components(sale_id);
CREATE INDEX idx_sale_basket_components_sale_item_id ON public.sale_basket_components(sale_item_id);