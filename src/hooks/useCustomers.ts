import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  notes?: string;
}

export interface CustomerSaleHistory {
  id: string;
  date: string;
  total: number;
  status: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCustomers = async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const mapped: Customer[] = (data || []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        birthday: c.birthday,
        notes: c.notes,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));

      setCustomers(mapped);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const addCustomer = async (data: CustomerFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("customers").insert({
        user_id: user.id,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        birthday: data.birthday || null,
        notes: data.notes?.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Cliente cadastrado",
        description: `"${data.name}" foi adicionado com sucesso.`,
      });

      await fetchCustomers();
      return true;
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Erro ao cadastrar cliente",
        description: "Não foi possível adicionar o cliente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateCustomer = async (id: string, data: CustomerFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          birthday: data.birthday || null,
          notes: data.notes?.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado",
        description: `"${data.name}" foi atualizado com sucesso.`,
      });

      await fetchCustomers();
      return true;
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Erro ao atualizar cliente",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const customer = customers.find((c) => c.id === id);
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: customer ? `"${customer.name}" foi removido.` : "Cliente removido.",
      });

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Erro ao excluir cliente",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getCustomerSalesHistory = async (customerId: string): Promise<CustomerSaleHistory[]> => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("id, created_at, total, status")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((s) => ({
        id: s.id,
        date: s.created_at,
        total: Number(s.total),
        status: s.status,
      }));
    } catch (error) {
      console.error("Error fetching customer sales history:", error);
      return [];
    }
  };

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerSalesHistory,
    refetch: fetchCustomers,
  };
}
