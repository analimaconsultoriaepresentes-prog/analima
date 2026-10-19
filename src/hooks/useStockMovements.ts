import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  StockMovement,
  MovementType,
  mapDbMovement,
} from "@/lib/stockMovements";

export interface RecordMovementInput {
  productId: string;
  movementType: MovementType;
  quantity: number; // com sinal: negativo sai, positivo entra
  previousStock: number;
  newStock: number;
  reason?: string;
  saleId?: string;
}

export function useStockMovements(productId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading: loading } = useQuery({
    queryKey: ["stock_movements", user?.id, productId || "all"],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(mapDbMovement);
    },
    enabled: !!user?.id,
  });

  const recordMovementMutation = useMutation({
    mutationFn: async (input: RecordMovementInput): Promise<boolean> => {
      if (!user) return false;

      const { error } = await supabase.from("stock_movements").insert({
        user_id: user.id,
        product_id: input.productId,
        movement_type: input.movementType,
        quantity: input.quantity,
        previous_stock: input.previousStock,
        new_stock: input.newStock,
        reason: input.reason || null,
        sale_id: input.saleId || null,
      });

      if (error) {
        console.error("Error recording stock movement:", error);
        return false;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_movements", user?.id] });
    },
  });

  const recordMovement = async (input: RecordMovementInput): Promise<boolean> => {
    try {
      return await recordMovementMutation.mutateAsync(input);
    } catch {
      return false;
    }
  };

  return { movements, loading, recordMovement };
}

/**
 * Retorna a data da última movimentação de cada produto (Map productId -> data ISO).
 * Usado na tela de Produtos para exibir "última movimentação" e filtrar parados.
 */
export function useLastMovementDates() {
  const { user } = useAuth();

  const { data: lastMovementByProduct = new Map<string, string>() } = useQuery({
    queryKey: ["stock_movements", user?.id, "last_dates"],
    queryFn: async () => {
      if (!user?.id) return new Map<string, string>();

      const { data, error } = await supabase
        .from("stock_movements")
        .select("product_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const map = new Map<string, string>();
      for (const row of data || []) {
        if (!map.has(row.product_id)) {
          map.set(row.product_id, row.created_at);
        }
      }
      return map;
    },
    enabled: !!user?.id,
  });

  return lastMovementByProduct;
}
