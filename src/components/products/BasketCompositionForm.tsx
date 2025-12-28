import { useState, useMemo } from "react";
import { Plus, Trash2, Package, ShoppingBasket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/hooks/useProducts";

interface BasketItemInput {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
}

interface BasketCompositionFormProps {
  availableProducts: Product[];
  items: BasketItemInput[];
  onItemsChange: (items: BasketItemInput[]) => void;
  packagingCost: number;
  onPackagingCostChange: (cost: number) => void;
  desiredMargin: number;
  onDesiredMarginChange: (margin: number) => void;
  isEditing?: boolean;
}

export function BasketCompositionForm({
  availableProducts,
  items,
  onItemsChange,
  packagingCost,
  onPackagingCostChange,
  desiredMargin,
  onDesiredMarginChange,
  isEditing = false,
}: BasketCompositionFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Filter out products that are already in the basket or are baskets themselves
  const selectableProducts = useMemo(() => {
    const usedIds = new Set(items.map((i) => i.productId));
    return availableProducts.filter(
      (p) => !usedIds.has(p.id) && !p.isBasket
    );
  }, [availableProducts, items]);

  const totalItemsCost = useMemo(() => {
    return items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  }, [items]);

  const totalCost = totalItemsCost + packagingCost;

  const suggestedSalePrice = useMemo(() => {
    if (desiredMargin <= 0 || totalCost <= 0) return 0;
    return totalCost * (1 + desiredMargin / 100);
  }, [totalCost, desiredMargin]);

  const estimatedProfit = suggestedSalePrice - totalCost;

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto para adicionar");
      return;
    }

    const product = availableProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if product already exists - if so, increment quantity
    const existingItem = items.find((i) => i.productId === selectedProductId);
    if (existingItem) {
      onItemsChange(
        items.map((i) =>
          i.productId === selectedProductId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
      toast.success(`Quantidade de ${product.name} aumentada`);
    } else {
      const newItem: BasketItemInput = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
      };
      onItemsChange([...items, newItem]);
      toast.success(`${product.name} adicionado à cesta`);
    }
    setSelectedProductId("");
  };

  const handleRemoveItem = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    onItemsChange(items.filter((i) => i.productId !== productId));
    if (item) {
      toast.success(`${item.productName} removido da cesta`);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    onItemsChange(
      items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  };

  return (
    <div className="space-y-5">
      {/* Add Product Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Adicionar Produto à Cesta</Label>
        <div className="flex gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="flex-1 input-styled min-h-[44px]">
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {selectableProducts.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {items.length > 0 ? "Todos os produtos já estão na cesta" : "Nenhum produto disponível"}
                </div>
              ) : (
                selectableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        R$ {product.costPrice.toFixed(2)} | Estoque: {product.stock}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleAddProduct}
            disabled={!selectedProductId}
            className="min-h-[44px] gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Itens da Cesta ({items.length})
          </Label>
          <ScrollArea className="max-h-[250px]">
            <div className="space-y-2">
              {items.map((item) => {
                const product = availableProducts.find((p) => p.id === item.productId);
                const currentStock = product?.stock ?? 0;
                const hasLowStock = product && currentStock < item.quantity;
                const hasNoStock = currentStock === 0;
                
                return (
                  <div
                    key={item.productId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      hasNoStock
                        ? "bg-destructive/5 border-destructive/30"
                        : hasLowStock 
                          ? "bg-warning/5 border-warning/30" 
                          : "bg-muted/50 border-border/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {item.costPrice.toFixed(2)} cada • Subtotal: R$ {(item.costPrice * item.quantity).toFixed(2)}
                      </p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        hasNoStock 
                          ? "text-destructive font-medium" 
                          : hasLowStock 
                            ? "text-warning" 
                            : "text-muted-foreground"
                      )}>
                        {hasNoStock 
                          ? "Sem estoque" 
                          : hasLowStock 
                            ? `Estoque insuficiente: ${currentStock} un.`
                            : `Estoque: ${currentStock} un.`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.productId, parseInt(e.target.value) || 1)
                        }
                        className="w-16 h-8 text-center input-styled"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 bg-muted/30 rounded-lg border border-dashed border-border">
          <ShoppingBasket className="w-10 h-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Nenhum item na cesta
          </p>
          {isEditing && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              Adicione produtos para compor a cesta
            </p>
          )}
        </div>
      )}

      {/* Costs Section */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Custo dos Itens</Label>
            <div className="h-[44px] flex items-center px-3 bg-muted/50 rounded-md border border-border/50">
              <span className="font-medium">R$ {totalItemsCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="packaging-cost" className="text-sm">Custo Embalagem</Label>
            <Input
              id="packaging-cost"
              type="number"
              min="0"
              step="0.01"
              value={packagingCost}
              onChange={(e) => onPackagingCostChange(parseFloat(e.target.value) || 0)}
              className="input-styled min-h-[44px]"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Custo Total</Label>
            <div className="h-[44px] flex items-center px-3 bg-primary/10 rounded-md border border-primary/20">
              <span className="font-bold text-primary">R$ {totalCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desired-margin" className="text-sm">Margem Desejada (%)</Label>
            <Input
              id="desired-margin"
              type="number"
              min="0"
              step="0.1"
              value={desiredMargin}
              onChange={(e) => onDesiredMarginChange(parseFloat(e.target.value) || 0)}
              className="input-styled min-h-[44px]"
              placeholder="50"
            />
          </div>
        </div>

        {/* Suggested Price & Profit */}
        {desiredMargin > 0 && totalCost > 0 && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Preço de Venda Sugerido</p>
                <p className="font-bold text-success text-lg">
                  R$ {suggestedSalePrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Lucro Estimado</p>
                <p className="font-bold text-success text-lg">
                  R$ {estimatedProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning for low stock items */}
        {items.some((item) => {
          const product = availableProducts.find((p) => p.id === item.productId);
          return product && product.stock < item.quantity;
        }) && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              Alguns itens têm estoque insuficiente para a quantidade selecionada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export type { BasketItemInput };
