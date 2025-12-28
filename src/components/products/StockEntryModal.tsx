import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface StockEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentStock: number;
  onConfirm: (quantity: number) => Promise<boolean>;
}

export function StockEntryModal({
  open,
  onOpenChange,
  productName,
  currentStock,
  onConfirm,
}: StockEntryModalProps) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const qty = parseInt(quantity, 10);
    
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Informe um número inteiro maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await onConfirm(qty);
    setLoading(false);

    if (success) {
      toast({
        title: "Estoque atualizado",
        description: `+${qty} unidades adicionadas ao estoque de "${productName}".`,
      });
      setQuantity("");
      onOpenChange(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setQuantity("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Entrada de Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Produto</p>
            <p className="font-medium">{productName}</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Estoque atual:</span>
            <span className="font-semibold">{currentStock} un.</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a adicionar *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="text-lg"
            />
          </div>

          {quantity && parseInt(quantity, 10) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-primary">
              <Plus className="w-4 h-4" />
              <span className="text-sm">
                Novo estoque: <span className="font-semibold">{currentStock + parseInt(quantity, 10)} un.</span>
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !quantity}>
            {loading ? "Salvando..." : "Confirmar entrada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
