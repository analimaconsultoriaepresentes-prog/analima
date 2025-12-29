-- Add packaging cost configuration to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS packaging_cost_1_bag DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS packaging_cost_2_bags DECIMAL(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.stores.packaging_cost_1_bag IS 'Custo de embalagem para 1-2 itens avulsos';
COMMENT ON COLUMN public.stores.packaging_cost_2_bags IS 'Custo de embalagem para 3-5 itens avulsos';