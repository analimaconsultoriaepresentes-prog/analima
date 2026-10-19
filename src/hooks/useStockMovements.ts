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

export interface LastMovementInfo {
  // Data da última movimentação de qualquer tipo (Map productId -> data ISO)
  lastMovement: Map<string, string>;
  // Data da última venda/doação (Map productId -> data ISO)
  lastSale: Map<string, string>;
}

/**
 * Retorna a data da última movimentação e da última venda de cada produto.
 * Usado na tela de Produtos para exibir "última movimentação" e filtrar
 * produtos parados ou vendidos recentemente.
 */
export function useLastMovementDates(): LastMovementInfo {
  const { user } = useAuth();

  const { data = { lastMovement: new Map<string, string>(), lastSale: new Map<string, string>() } } = useQuery({
    queryKey: ["stock_movements", user?.id, "last_dates"],
    queryFn: async (): Promise<LastMovementInfo> => {
      const empty = { lastMovement: new Map<string, string>(), lastSale: new Map<string, string>() };
      if (!user?.id) return empty;

      const { data, error } = await supabase
        .from("stock_movements")
        .select("product_id, movement_type, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const lastMovement = new Map<string, string>();
      const lastSale = new Map<string, string>();
      for (const row of data || []) {
        if (!lastMovement.has(row.product_id)) {
          lastMovement.set(row.product_id, row.created_at);
        }
        if (
          (row.movement_type === "venda" || row.movement_type === "doacao") &&
          !lastSale.has(row.product_id)
        ) {
          lastSale.set(row.product_id, row.created_at);
        }
      }
      return { lastMovement, lastSale };
    },
    enabled: !!user?.id,
  });

  return data;
}
