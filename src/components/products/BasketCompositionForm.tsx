import { useState, useEffect, useMemo } from "react";
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
}

export function BasketCompositionForm({
  availableProducts,
  items,
  onItemsChange,
  packagingCost,
  onPackagingCostChange,
  desiredMargin,
  onDesiredMarginChange,
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
    if (!selectedProductId) return;

    const product = availableProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

    const newItem: BasketItemInput = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
    };

    onItemsChange([...items, newItem]);
    setSelectedProductId("");
  };

  const handleRemoveItem = (productId: string) => {
    onItemsChange(items.filter((i) => i.productId !== productId));
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
                  Nenhum produto disponível
                </div>
              ) : (
                selectableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        R$ {product.costPrice.toFixed(2)}
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
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {item.costPrice.toFixed(2)} cada
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
                      onClick={() => handleRemoveItem(item.productId)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 bg-muted/30 rounded-lg border border-dashed border-border">
          <ShoppingBasket className="w-10 h-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Adicione produtos para compor a cesta
          </p>
        </div>
      )}

      {/* Costs Section */}
      {items.length > 0 && (
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
          {desiredMargin > 0 && (
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
      )}
    </div>
  );
}

export type { BasketItemInput };
