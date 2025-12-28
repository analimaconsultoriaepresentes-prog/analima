import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Account {
  id: string;
  user_id: string;
  description: string;
  person: string;
  amount: number;
  due_date: string;
  status: "em_dia" | "vencendo" | "atrasado" | "pago";
  account_type: "pagar" | "receber";
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  description: string;
  person: string;
  amount: number;
  due_date: string;
  status: "em_dia" | "vencendo" | "atrasado" | "pago";
  account_type: "pagar" | "receber";
}

export function useAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("due_date", { ascending: true });
      
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user?.id,
  });

  const createAccount = useMutation({
    mutationFn: async (accountData: AccountFormData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          ...accountData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar conta:", error);
      toast.error("Erro ao criar conta");
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Account> & { id: string }) => {
      const { error } = await supabase
        .from("accounts")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta atualizada!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar conta:", error);
      toast.error("Erro ao atualizar conta");
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta excluída!");
    },
    onError: (error) => {
      console.error("Erro ao excluir conta:", error);
      toast.error("Erro ao excluir conta");
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .update({ status: "pago" })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta marcada como paga!");
    },
    onError: (error) => {
      console.error("Erro ao marcar como paga:", error);
      toast.error("Erro ao atualizar status");
    },
  });

  // Cálculos - apenas contas não pagas
  const totalPagar = accounts
    .filter((a) => a.account_type === "pagar" && a.status !== "pago")
    .reduce((acc, a) => acc + Number(a.amount), 0);

  const totalReceber = accounts
    .filter((a) => a.account_type === "receber" && a.status !== "pago")
    .reduce((acc, a) => acc + Number(a.amount), 0);

  const saldo = totalReceber - totalPagar;

  return {
    accounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    markAsPaid,
    totalPagar,
    totalReceber,
    saldo,
  };
}
