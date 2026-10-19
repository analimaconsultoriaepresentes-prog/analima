import { useMemo } from "react";
import { GitCompareArrows, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/hooks/useProducts";
import { findDuplicateGroups } from "@/lib/duplicates";

interface DuplicatesReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onEditProduct: (product: Product) => void;
}

const formatPrice = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function DuplicatesReviewModal({
  open,
  onOpenChange,
  products,
  onEditProduct,
}: DuplicatesReviewModalProps) {
  // Agrupa produtos parecidos entre si. Nada é alterado automaticamente.
  const groups = useMemo(
    () => (open ? findDuplicateGroups(products.filter((p) => p.isActive)) : []),
    [open, products]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5 text-primary" />
            Revisar possíveis duplicados
          </DialogTitle>
          <DialogDescription>
            Compare os cadastros parecidos lado a lado e decida o que fazer. Nenhum produto é
            excluído, unido ou alterado automaticamente — o histórico de vendas e movimentações
            é sempre preservado.
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-success" />
            <p className="text-sm font-medium text-foreground">Nenhuma duplicidade encontrada</p>
            <p className="text-xs text-muted-foreground">
              Seus cadastros ativos não têm nomes parecidos entre si.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {groups.map((group, index) => (
              <div key={index} className="rounded-lg border border-border/50 overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                  Grupo {index + 1} — {group.length} cadastros parecidos
                </div>
                <div className="divide-y divide-border/50">
                  {group.map((product) => (
                    <div key={product.id} className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.brand || "Sem marca"} · {product.category}
                            {product.code ? ` · Cód. ${product.code}` : ""}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 flex-shrink-0"
                          onClick={() => onEditProduct(product)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Custo: <strong className="text-foreground">{formatPrice(product.costPrice)}</strong>
                        </span>
                        <span>
                          Pix: <strong className="text-foreground">{formatPrice(product.pricePix)}</strong>
                        </span>
                        <span>
                          Cartão: <strong className="text-foreground">{formatPrice(product.priceCard)}</strong>
                        </span>
                        <span>
                          Estoque: <strong className="text-foreground">{product.stock} un.</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
