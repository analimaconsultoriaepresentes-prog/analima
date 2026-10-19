import { AlertTriangle, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/hooks/useProducts";
import type { DuplicateMatch } from "@/lib/duplicates";

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newProductName: string;
  candidates: DuplicateMatch<Product>[];
  onEditExisting: (product: Product) => void;
  onConfirmNew: () => void;
  onCancel: () => void;
}

const formatPrice = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  newProductName,
  candidates,
  onEditExisting,
  onConfirmNew,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Possível produto duplicado
          </DialogTitle>
          <DialogDescription>
            Encontramos {candidates.length === 1 ? "um produto parecido" : `${candidates.length} produtos parecidos`} com{" "}
            <strong>{newProductName}</strong>. Confira antes de cadastrar — pode ser o mesmo produto
            ou apenas uma versão diferente (tamanho, cor, apresentação).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {candidates.map(({ product, score, reasons }) => (
            <div
              key={product.id}
              className="rounded-lg border border-border/50 p-3 space-y-2 bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm leading-tight">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.brand || "Sem marca"} · {product.category}
                    {product.code ? ` · Cód. ${product.code}` : ""}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    score >= 70
                      ? "bg-destructive/10 text-destructive border-destructive/20 flex-shrink-0"
                      : "bg-warning/10 text-warning border-warning/20 flex-shrink-0"
                  }
                >
                  {score >= 70 ? "Muito parecido" : "Parecido"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {reasons.map((reason) => (
                    <span
                      key={reason}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onEditExisting(product)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar este produto
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="w-4 h-4" />
            Cancelar cadastro
          </Button>
          <Button onClick={onConfirmNew} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            É um produto diferente, cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
