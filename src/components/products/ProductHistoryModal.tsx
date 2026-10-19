import { History, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStockMovements } from "@/hooks/useStockMovements";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_ICONS } from "@/lib/stockMovements";
import { formatDateTimeInBrazil } from "@/lib/timezone";
import type { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface ProductHistoryModalProps {
  product: Product | null;
  onClose: () => void;
}

const formatMovementDate = (iso: string) => {
  const { date, time } = formatDateTimeInBrazil(new Date(iso));
  return `${date} ${time}`;
};

export function ProductHistoryModal({ product, onClose }: ProductHistoryModalProps) {
  const { movements, loading } = useStockMovements(product?.id);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de estoque
          </DialogTitle>
          <DialogDescription>
            {product?.name}
            {product?.code ? ` · Cód. ${product.code}` : ""} — todas as entradas e saídas registradas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : movements.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada para este produto ainda.
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="rounded-lg border border-border/50 p-3 bg-muted/20 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <span aria-hidden>{MOVEMENT_TYPE_ICONS[movement.movementType]}</span>
                    {MOVEMENT_TYPE_LABELS[movement.movementType]}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      movement.quantity > 0
                        ? "text-success"
                        : movement.quantity < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    )}
                  >
                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>
                    Estoque: {movement.previousStock}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="font-medium text-foreground">{movement.newStock}</span>
                </div>
                {movement.reason && (
                  <p className="text-xs text-muted-foreground">{movement.reason}</p>
                )}
                <p className="text-[11px] text-muted-foreground/70">
                  {formatMovementDate(movement.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
