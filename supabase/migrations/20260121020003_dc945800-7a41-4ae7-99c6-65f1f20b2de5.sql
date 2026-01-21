-- Add discount and payment tracking columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type text,
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_reason text,
ADD COLUMN IF NOT EXISTS amount_received numeric,
ADD COLUMN IF NOT EXISTS change_amount numeric,
ADD COLUMN IF NOT EXISTS estimated_profit numeric;