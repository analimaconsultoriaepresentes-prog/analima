import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: "pago" | "pendente";
  expense_type: "fixa" | "variavel";
  is_recurring: boolean;
  recurring_day: number | null;
  recurring_start_date: string | null;
  recurring_end_date: string | null;
  parent_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: "pago" | "pendente";
  expense_type: "fixa" | "variavel";
  is_recurring?: boolean;
  recurring_day?: number | null;
  recurring_start_date?: string | null;
  recurring_end_date?: string | null;
}

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("due_date", { ascending: true });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user?.id,
  });

  const createExpense = useMutation({
    mutationFn: async (expenseData: ExpenseFormData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expenseData,
          user_id: user.id,
          is_recurring: expenseData.is_recurring || false,
          recurring_day: expenseData.recurring_day || null,
          recurring_start_date: expenseData.recurring_start_date || null,
          recurring_end_date: expenseData.recurring_end_date || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar despesa:", error);
      toast.error("Erro ao criar despesa");
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Expense> & { id: string }) => {
      const { error } = await supabase
        .from("expenses")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa atualizada!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar despesa:", error);
      toast.error("Erro ao atualizar despesa");
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa excluída!");
    },
    onError: (error) => {
      console.error("Erro ao excluir despesa:", error);
      toast.error("Erro ao excluir despesa");
    },
  });

  const toggleExpenseStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "pago" ? "pendente" : "pago";
      const { error } = await supabase
        .from("expenses")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(newStatus === "pago" ? "Despesa marcada como paga!" : "Despesa marcada como pendente!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    },
  });

  const stopRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .update({ 
          is_recurring: false,
          recurring_end_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Recorrência encerrada!");
    },
    onError: (error) => {
      console.error("Erro ao encerrar recorrência:", error);
      toast.error("Erro ao encerrar recorrência");
    },
  });

  // Separate recurring templates from regular expenses
  const recurringTemplates = expenses.filter((e) => e.is_recurring);
  const regularExpenses = expenses.filter((e) => !e.is_recurring);

  // Cálculos (only for regular expenses, not templates)
  const totalPending = regularExpenses
    .filter((e) => e.status === "pendente")
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const totalPaid = regularExpenses
    .filter((e) => e.status === "pago")
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const totalMonth = totalPending + totalPaid;

  return {
    expenses: regularExpenses,
    recurringTemplates,
    allExpenses: expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    toggleExpenseStatus,
    stopRecurring,
    totalPending,
    totalPaid,
    totalMonth,
  };
}