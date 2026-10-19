// Tipos e regras do histórico de movimentação de estoque.

export type MovementType =
  | "cadastro"
  | "entrada"
  | "venda"
  | "doacao"
  | "devolucao"
  | "ajuste"
  | "conferencia";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  cadastro: "Cadastro inicial",
  entrada: "Entrada de mercadoria",
  venda: "Venda",
  doacao: "Doação",
  devolucao: "Devolução",
  ajuste: "Ajuste manual",
  conferencia: "Conferência de estoque",
};

export const MOVEMENT_TYPE_ICONS: Record<MovementType, string> = {
  cadastro: "📦",
  entrada: "➕",
  venda: "🛒",
  doacao: "🎁",
  devolucao: "↩️",
  ajuste: "✏️",
  conferencia: "✅",
};

export interface StockMovement {
  id: string;
  productId: string;
  movementType: MovementType;
  quantity: number; // com sinal: negativo sai, positivo entra
  previousStock: number;
  newStock: number;
  reason?: string;
  saleId?: string;
  createdAt: string;
}

export interface MovementInput {
  movementType: MovementType;
  quantity: number; // com sinal
  reason?: string;
  saleId?: string;
}

/**
 * Monta uma movimentação calculando o saldo anterior e posterior.
 * A quantidade deve vir com sinal (negativa para saídas).
 */
export function buildMovement(
  currentStock: number,
  input: MovementInput
): { quantity: number; previousStock: number; newStock: number } {
  const previousStock = currentStock;
  const newStock = currentStock + input.quantity;
  return {
    quantity: input.quantity,
    previousStock,
    newStock,
  };
}

/**
 * Calcula a diferença entre o estoque registrado e o contado fisicamente.
 * Positivo = sobrou; negativo = faltou.
 */
export function computeStockDifference(registered: number, counted: number): number {
  return counted - registered;
}

/**
 * Monta a movimentação de ajuste de uma conferência:
 * a quantidade é a diferença entre o contado e o registrado.
 */
export function buildAdjustmentMovement(
  registered: number,
  counted: number,
  reason: string
): { quantity: number; previousStock: number; newStock: number; reason: string } | null {
  const diff = computeStockDifference(registered, counted);
  if (diff === 0) return null;
  return {
    quantity: diff,
    previousStock: registered,
    newStock: counted,
    reason,
  };
}

export function mapDbMovement(m: any): StockMovement {
  return {
    id: m.id,
    productId: m.product_id,
    movementType: m.movement_type as MovementType,
    quantity: m.quantity,
    previousStock: m.previous_stock,
    newStock: m.new_stock,
    reason: m.reason || undefined,
    saleId: m.sale_id || undefined,
    createdAt: m.created_at,
  };
}
