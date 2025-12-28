-- Adicionar colunas para despesas recorrentes
ALTER TABLE public.expenses
ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
ADD COLUMN recurring_day integer DEFAULT NULL,
ADD COLUMN recurring_start_date date DEFAULT NULL,
ADD COLUMN recurring_end_date date DEFAULT NULL,
ADD COLUMN parent_expense_id uuid DEFAULT NULL REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Adicionar índice para buscar despesas recorrentes ativas
CREATE INDEX idx_expenses_recurring ON public.expenses (is_recurring, recurring_start_date, recurring_end_date) WHERE is_recurring = true;

-- Comentários explicativos
COMMENT ON COLUMN public.expenses.is_recurring IS 'Indica se esta é uma despesa recorrente (template)';
COMMENT ON COLUMN public.expenses.recurring_day IS 'Dia do mês para vencimento da despesa recorrente (1-31)';
COMMENT ON COLUMN public.expenses.recurring_start_date IS 'Data de início da recorrência';
COMMENT ON COLUMN public.expenses.recurring_end_date IS 'Data de término da recorrência (opcional)';
COMMENT ON COLUMN public.expenses.parent_expense_id IS 'Referência à despesa recorrente que gerou esta despesa';