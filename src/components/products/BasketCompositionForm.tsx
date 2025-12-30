import { useState, useMemo } from "react";
import { Plus, Trash2, Package, ShoppingBasket, AlertCircle, Gift, Box } from "lucide-react";
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

export interface BasketItemInput {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  // New: manual sale price override (when item has no pricePix)
  manualSalePrice?: number;
}

export interface BasketExtraInput {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

interface BasketCompositionFormProps {
  availableProducts: Product[];
  items: BasketItemInput[];
  onItemsChange: (items: BasketItemInput[]) => void;
  // Packaging/extras props
  packagingProductId?: string;
  onPackagingProductIdChange: (id: string | undefined) => void;
  packagingQty: number;
  onPackagingQtyChange: (qty: number) => void;
  extras: BasketExtraInput[];
  onExtrasChange: (extras: BasketExtraInput[]) => void;
  isEditing?: boolean;
}

export function BasketCompositionForm({
  availableProducts,
  items,
  onItemsChange,
  packagingProductId,
  onPackagingProductIdChange,
  packagingQty,
  onPackagingQtyChange,
  extras,
  onExtrasChange,
  isEditing = false,
}: BasketCompositionFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedExtraId, setSelectedExtraId] = useState<string>("");

  // Filter products for basket items (only regular items, not packaging/extra/baskets)
  const selectableProducts = useMemo(() => {
    const usedIds = new Set(items.map((i) => i.productId));
    return availableProducts.filter(
      (p) => !usedIds.has(p.id) && p.productType === "item" && p.isActive
    );
  }, [availableProducts, items]);

  // Filter products for packaging selection
  const packagingProducts = useMemo(() => {
    return availableProducts.filter(
      (p) => p.productType === "packaging" && p.isActive
    );
  }, [availableProducts]);

  // Filter products for extras selection
  const extraProducts = useMemo(() => {
    const usedExtraIds = new Set(extras.map((e) => e.productId));
    return availableProducts.filter(
      (p) => p.productType === "extra" && p.isActive && !usedExtraIds.has(p.id)
    );
  }, [availableProducts, extras]);

  // Get the selected packaging product
  const selectedPackaging = useMemo(() => {
    if (!packagingProductId) return null;
    return availableProducts.find((p) => p.id === packagingProductId);
  }, [availableProducts, packagingProductId]);

  // Calculate costs
  const totalItemsCost = useMemo(() => {
    return items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  }, [items]);

  const packagingCost = useMemo(() => {
    if (!selectedPackaging) return 0;
    return selectedPackaging.costPrice * packagingQty;
  }, [selectedPackaging, packagingQty]);

  const totalExtrasCost = useMemo(() => {
    return extras.reduce((sum, extra) => sum + extra.unitCost * extra.quantity, 0);
  }, [extras]);

  const totalCost = totalItemsCost + packagingCost + totalExtrasCost;

  // Calculate items price (sum of Pix prices or manual prices)
  const itemsPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      // Use manual price if set, otherwise use salePrice (which is pricePix from product)
      const priceToUse = item.manualSalePrice !== undefined ? item.manualSalePrice : item.salePrice;
      return sum + priceToUse * item.quantity;
    }, 0);
  }, [items]);

  // Calculate "Preço Base do Presente" = items price + packaging cost + extras cost
  const baseGiftPrice = itemsPrice + packagingCost + totalExtrasCost;

  // Handlers for items
  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto para adicionar");
      return;
    }

    const product = availableProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

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
      // Use pricePix if available, otherwise 0 (user will need to set manually)
      const itemPricePix = product.pricePix || 0;
      const newItem: BasketItemInput = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        costPrice: product.costPrice,
        salePrice: itemPricePix,
        manualSalePrice: itemPricePix === 0 ? undefined : undefined, // will be set manually if needed
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

  // Handle manual sale price change for items without pricePix
  const handleManualSalePriceChange = (productId: string, price: number) => {
    onItemsChange(
      items.map((i) =>
        i.productId === productId ? { ...i, manualSalePrice: price } : i
      )
    );
  };

  // Handlers for extras
  const handleAddExtra = () => {
    if (!selectedExtraId) {
      toast.error("Selecione um extra para adicionar");
      return;
    }

    const product = availableProducts.find((p) => p.id === selectedExtraId);
    if (!product) return;

    const newExtra: BasketExtraInput = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitCost: product.costPrice,
    };
    onExtrasChange([...extras, newExtra]);
    toast.success(`${product.name} adicionado aos extras`);
    setSelectedExtraId("");
  };

  const handleRemoveExtra = (productId: string) => {
    const extra = extras.find((e) => e.productId === productId);
    onExtrasChange(extras.filter((e) => e.productId !== productId));
    if (extra) {
      toast.success(`${extra.productName} removido dos extras`);
    }
  };

  const handleExtraQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    onExtrasChange(
      extras.map((e) =>
        e.productId === productId ? { ...e, quantity } : e
      )
    );
  };

  // Check stock for all items
  const hasStockWarning = useMemo(() => {
    // Check items
    for (const item of items) {
      const product = availableProducts.find((p) => p.id === item.productId);
      if (product && product.stock < item.quantity) return true;
    }
    // Check packaging
    if (selectedPackaging && selectedPackaging.stock < packagingQty) return true;
    // Check extras
    for (const extra of extras) {
      const product = availableProducts.find((p) => p.id === extra.productId);
      if (product && product.stock < extra.quantity) return true;
    }
    return false;
  }, [items, extras, selectedPackaging, packagingQty, availableProducts]);

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
                  {items.length > 0 ? "Todos os produtos já estão na cesta" : "Nenhum produto tipo 'Item' disponível"}
                </div>
              ) : (
                selectableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Pix: R$ {(product.pricePix || 0).toFixed(2)} | Est: {product.stock}
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
                const needsManualPrice = item.salePrice === 0;
                const effectivePrice = item.manualSalePrice !== undefined ? item.manualSalePrice : item.salePrice;
                
                return (
                  <div
                    key={item.productId}
                    className={cn(
                      "flex flex-col gap-2 p-3 rounded-lg border",
                      hasNoStock
                        ? "bg-destructive/5 border-destructive/30"
                        : hasLowStock 
                          ? "bg-warning/5 border-warning/30" 
                          : needsManualPrice
                            ? "bg-muted/70 border-primary/30"
                            : "bg-muted/50 border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Custo: R$ {item.costPrice.toFixed(2)} | Pix: R$ {effectivePrice.toFixed(2)} × {item.quantity}
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
                    
                    {/* Manual price input for items without pricePix */}
                    {needsManualPrice && (
                      <div className="flex items-center gap-2 ml-11">
                        <Label className="text-xs text-primary whitespace-nowrap">Preço Pix:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={item.manualSalePrice ?? ""}
                          onChange={(e) =>
                            handleManualSalePriceChange(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 h-7 text-sm input-styled"
                        />
                        <span className="text-xs text-muted-foreground">(sem preço cadastrado)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-muted/30 rounded-lg border border-dashed border-border">
          <ShoppingBasket className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Nenhum item na cesta
          </p>
        </div>
      )}

      {/* Packaging Section */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Box className="w-4 h-4" />
          Embalagem Principal
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Select 
              value={packagingProductId || ""} 
              onValueChange={(val) => onPackagingProductIdChange(val || undefined)}
            >
              <SelectTrigger className="input-styled min-h-[44px]">
                <SelectValue placeholder="Selecione uma embalagem" />
              </SelectTrigger>
              <SelectContent>
                {packagingProducts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma embalagem cadastrada. Cadastre produtos do tipo "Embalagem".
                  </div>
                ) : (
                  packagingProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          R$ {product.costPrice.toFixed(2)} | Est: {product.stock}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="number"
              min="1"
              value={packagingQty}
              onChange={(e) => onPackagingQtyChange(parseInt(e.target.value) || 1)}
              className="input-styled min-h-[44px]"
              placeholder="Qtd"
            />
          </div>
        </div>
        {selectedPackaging && (
          <div className="text-sm text-muted-foreground">
            Custo embalagem: R$ {packagingCost.toFixed(2)}
            {selectedPackaging.stock < packagingQty && (
              <span className="text-destructive ml-2">
                (Estoque insuficiente: {selectedPackaging.stock} un.)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Extras Section */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Extras (opcional)
        </Label>
        <div className="flex gap-2">
          <Select value={selectedExtraId} onValueChange={setSelectedExtraId}>
            <SelectTrigger className="flex-1 input-styled min-h-[44px]">
              <SelectValue placeholder="Adicionar extra..." />
            </SelectTrigger>
            <SelectContent>
              {extraProducts.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {extras.length > 0 ? "Todos extras já adicionados" : "Nenhum extra cadastrado. Cadastre produtos do tipo 'Extra'."}
                </div>
              ) : (
                extraProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        R$ {product.costPrice.toFixed(2)} | Est: {product.stock}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleAddExtra}
            disabled={!selectedExtraId}
            variant="outline"
            className="min-h-[44px] gap-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Extras List */}
        {extras.length > 0 && (
          <div className="space-y-2">
            {extras.map((extra) => {
              const product = availableProducts.find((p) => p.id === extra.productId);
              const hasLowStock = product && product.stock < extra.quantity;
              
              return (
                <div
                  key={extra.productId}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border",
                    hasLowStock ? "bg-warning/5 border-warning/30" : "bg-muted/30 border-border/50"
                  )}
                >
                  <Gift className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{extra.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {extra.unitCost.toFixed(2)} × {extra.quantity} = R$ {(extra.unitCost * extra.quantity).toFixed(2)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={extra.quantity}
                    onChange={(e) =>
                      handleExtraQuantityChange(extra.productId, parseInt(e.target.value) || 1)
                    }
                    className="w-14 h-7 text-center input-styled text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveExtra(extra.productId)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Costs Summary */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Custo dos Itens</Label>
            <div className="h-[40px] flex items-center px-3 bg-muted/50 rounded-md border border-border/50">
              <span className="font-medium">R$ {totalItemsCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Custo Embalagem</Label>
            <div className="h-[40px] flex items-center px-3 bg-muted/50 rounded-md border border-border/50">
              <span className="font-medium">R$ {packagingCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Custo Extras</Label>
            <div className="h-[40px] flex items-center px-3 bg-muted/50 rounded-md border border-border/50">
              <span className="font-medium">R$ {totalExtrasCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-semibold">Custo Total</Label>
            <div className="h-[40px] flex items-center px-3 bg-primary/10 rounded-md border border-primary/20">
              <span className="font-bold text-primary">R$ {totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Valor dos Produtos (Pix) */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground font-semibold">Valor dos Produtos (soma Pix)</Label>
          <div className="h-[40px] flex items-center px-3 bg-blue-500/10 rounded-md border border-blue-500/20">
            <span className="font-bold text-blue-600">R$ {itemsPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Preço Base do Presente */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground font-semibold">Preço Base do Presente (Produtos + Emb. + Extras)</Label>
          <div className="h-[40px] flex items-center px-3 bg-primary/10 rounded-md border border-primary/20">
            <span className="font-bold text-primary">R$ {baseGiftPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Stock Warning */}
        {hasStockWarning && (
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

// Export calculators for use in ProductForm
export function calculateItemsPrice(items: BasketItemInput[]): number {
  return items.reduce((sum, item) => {
    const priceToUse = item.manualSalePrice !== undefined ? item.manualSalePrice : item.salePrice;
    return sum + priceToUse * item.quantity;
  }, 0);
}

export function calculateBaseGiftPrice(
  items: BasketItemInput[], 
  packagingCost: number, 
  extrasCost: number
): number {
  const itemsPrice = calculateItemsPrice(items);
  return itemsPrice + packagingCost + extrasCost;
}
