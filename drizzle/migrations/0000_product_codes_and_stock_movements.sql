-- Código único e código de barras nos produtos
ALTER TABLE public.products ADD COLUMN code text;
ALTER TABLE public.products ADD COLUMN barcode text;

CREATE SEQUENCE IF NOT EXISTS public.product_code_seq;

-- Preenche códigos para produtos existentes
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.products
)
UPDATE public.products p
SET code = 'P-' || lpad((n.rn)::text, 4, '0')
FROM numbered n
WHERE p.id = n.id AND p.code IS NULL;

-- Garante que a sequência continue após os códigos já usados
SELECT setval('public.product_code_seq', (SELECT COUNT(*) FROM public.products) + 1, false);

ALTER TABLE public.products ALTER COLUMN code SET DEFAULT 'P-' || lpad(nextval('public.product_code_seq')::text, 4, '0');

CREATE UNIQUE INDEX products_user_code_unique ON public.products (user_id, code) WHERE code IS NOT NULL;
CREATE INDEX products_barcode_idx ON public.products (barcode) WHERE barcode IS NOT NULL;

-- Histórico de movimentação de estoque (somente inclusão, nunca apaga)
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reason text,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock movements"
  ON public.stock_movements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock movements"
  ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX stock_movements_product_idx ON public.stock_movements (product_id, created_at DESC);
CREATE INDEX stock_movements_user_idx ON public.stock_movements (user_id, created_at DESC);

-- Backfill: movimentação inicial de cadastro para produtos existentes
INSERT INTO public.stock_movements (user_id, product_id, movement_type, quantity, previous_stock, new_stock, reason, created_at)
SELECT user_id, id, 'cadastro', stock, 0, stock, 'Cadastro inicial do produto', created_at
FROM public.products
WHERE user_id IS NOT NULL;