import { useState, useMemo, useEffect } from "react";
import { Calculator, Plus, Trash2, Package, Save, Loader2, ShoppingBasket, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product, ProductFormData } from "@/hooks/useProducts";
import { toast } from "@/hooks/use-toast";

interface KitItem {
  id: string;
  name: string;
  fullPrice: number;
  quantity: number;
  productId?: string;
}

interface KitCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProducts: Product[];
  onSaveAsBasket?: (
    data: ProductFormData,
    basketItems: { productId: string; quantity: number }[]
  ) => Promise<void>;
}

export function KitCalculator({ 
  open, 
  onOpenChange, 
  availableProducts,
  onSaveAsBasket 
}: KitCalculatorProps) {
  const isMobile = useIsMobile();
  const [kitName, setKitName] = useState("");
  const [comboName, setComboName] = useState("");
  const [kitFullPrice, setKitFullPrice] = useState("");
  const [kitFullPriceManual, setKitFullPriceManual] = useState(false);
  const [kitPrice, setKitPrice] = useState("");
  const [kitCost, setKitCost] = useState("");
  const [items, setItems] = useState<KitItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Calculate auto sum of items
  const autoSum = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.fullPrice * item.quantity), 0);
  }, [items]);

  // Auto-update kitFullPrice when items change (if not manual)
  useEffect(() => {
    if (!kitFullPriceManual && items.length > 0) {
      setKitFullPrice(autoSum > 0 ? autoSum.toFixed(2) : "");
    }
  }, [autoSum, kitFullPriceManual, items.length]);

  // Handle manual edit of kitFullPrice
  const handleKitFullPriceChange = (value: string) => {
    setKitFullPrice(value);
    const numValue = parseFloat(value) || 0;
    // Mark as manual if user edits and value differs from auto sum
    if (numValue !== autoSum) {
      setKitFullPriceManual(true);
    }
  };

  // Reset manual flag when value matches auto sum
  const resetToAutoSum = () => {
    setKitFullPriceManual(false);
    setKitFullPrice(autoSum > 0 ? autoSum.toFixed(2) : "");
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: "",
        fullPrice: 0,
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof KitItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const selectProduct = (id: string, productId: string) => {
    const product = availableProducts.find((p) => p.id === productId);
    if (product) {
      setItems(
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                productId: product.id,
                name: product.name,
                fullPrice: product.salePrice,
              }
            : item
        )
      );
    }
  };

  // Check if an item is valid: (name OR productId) AND fullPrice > 0 AND quantity >= 1
  const isItemValid = (item: KitItem): boolean => {
    const hasNameOrProduct = (item.name && item.name.trim().length > 0) || !!item.productId;
    return hasNameOrProduct && item.fullPrice > 0 && item.quantity >= 1;
  };

  // Get valid items for calculations
  const validItems = useMemo(() => items.filter(isItemValid), [items]);

  const calculations = useMemo(() => {
    const kitFullPriceNum = parseFloat(kitFullPrice) || 0;
    const kitPriceNum = parseFloat(kitPrice) || 0;
    const kitCostNum = parseFloat(kitCost) || 0;

    // Need at least one valid item and all required fields
    if (validItems.length === 0 || kitFullPriceNum <= 0 || kitPriceNum <= 0 || kitCostNum < 0) {
      return { 
        items: [], 
        kitFullPriceNum,
        kitPriceNum, 
        kitCostNum, 
        totalProfit: 0,
        totalMargin: 0,
        hasValidResults: false
      };
    }

    const calculatedItems = validItems.map((item) => {
      const itemTotal = item.fullPrice * item.quantity;
      const proportion = kitFullPriceNum > 0 ? itemTotal / kitFullPriceNum : 0;
      const priceInKit = kitPriceNum * proportion;
      const costInKit = kitCostNum * proportion;
      const profit = priceInKit - costInKit;
      const margin = priceInKit > 0 ? (profit / priceInKit) * 100 : 0;

      return {
        ...item,
        itemTotal,
        proportion,
        priceInKit,
        costInKit,
        profit,
        margin,
      };
    });

    const totalProfit = kitPriceNum - kitCostNum;
    const totalMargin = kitPriceNum > 0 ? (totalProfit / kitPriceNum) * 100 : 0;

    return {
      items: calculatedItems,
      kitFullPriceNum,
      kitPriceNum,
      kitCostNum,
      totalProfit,
      totalMargin,
      hasValidResults: true
    };
  }, [validItems, kitFullPrice, kitPrice, kitCost]);

  // Validation for save
  const validation = useMemo(() => {
    const errors: string[] = [];
    
    if (!comboName.trim()) {
      errors.push("Nome do combo é obrigatório");
    }
    
    const validItemsWithProduct = validItems.filter(item => item.productId);
    if (validItemsWithProduct.length === 0) {
      errors.push("Pelo menos 1 item válido vinculado a produto");
    }
    
    const kitPriceNum = parseFloat(kitPrice) || 0;
    if (kitPriceNum <= 0) {
      errors.push("Preço para cliente deve ser maior que 0");
    }
    
    const kitCostNum = parseFloat(kitCost);
    if (isNaN(kitCostNum) || kitCostNum < 0) {
      errors.push("Custo para loja deve ser >= 0");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      validItemsWithProduct
    };
  }, [comboName, validItems, kitPrice, kitCost]);

  const handleSaveAsBasket = async () => {
    if (!onSaveAsBasket || !validation.isValid) return;

    setSaving(true);
    try {
      const kitPriceNum = parseFloat(kitPrice) || 0;
      const kitCostNum = parseFloat(kitCost) || 0;

      const basketData: ProductFormData = {
        name: comboName.trim(),
        brand: "Combo",
        category: "Presente",
        costPrice: kitCostNum,
        salePrice: kitPriceNum,
        stock: 0,
        origin: "purchased",
        productType: "item",
        isBasket: true,
        packagingProductId: undefined,
        packagingQty: 1,
        packagingCost: 0,
      };

      const basketItems = validation.validItemsWithProduct.map((item) => ({
        productId: item.productId!,
        quantity: item.quantity,
      }));

      await onSaveAsBasket(basketData, basketItems);
      
      toast({
        title: "Kit salvo com sucesso!",
        description: `"${comboName}" foi salva como cesta/combo.`,
      });

      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Error saving basket:", error);
      toast({
        title: "Erro ao salvar kit",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setKitName("");
    setComboName("");
    setKitFullPrice("");
    setKitFullPriceManual(false);
    setKitPrice("");
    setKitCost("");
    setItems([]);
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Kit Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kitName">Nome do Kit (referência)</Label>
          <Input
            id="kitName"
            placeholder="Ex: Kit Dia das Mães"
            value={kitName}
            onChange={(e) => setKitName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Apenas para cálculo interno</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kitFullPrice">Preço Cheio do Kit (soma) *</Label>
            <Input
              id="kitFullPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={kitFullPrice}
              onChange={(e) => handleKitFullPriceChange(e.target.value)}
            />
            {kitFullPriceManual && autoSum > 0 && Math.abs(parseFloat(kitFullPrice) - autoSum) > 0.01 && (
              <div className="flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Valor manual. Soma dos itens: R$ {autoSum.toFixed(2)}.{" "}
                  <button 
                    type="button"
                    onClick={resetToAutoSum}
                    className="underline hover:no-underline"
                  >
                    Usar soma automática
                  </button>
                </span>
              </div>
            )}
            {!kitFullPriceManual && (
              <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kitPrice">Preço para o Cliente *</Label>
            <Input
              id="kitPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={kitPrice}
              onChange={(e) => setKitPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Preço promocional final</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kitCost">Custo para a Loja *</Label>
            <Input
              id="kitCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={kitCost}
              onChange={(e) => setKitCost(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Custo total do kit para você</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Itens do Kit</Label>
          <Button variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Adicione itens ao kit para calcular a proporção
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Produto</Label>
                  <Select
                    value={item.productId || ""}
                    onValueChange={(value) => {
                      if (value === "manual") {
                        updateItem(item.id, "productId", "");
                        updateItem(item.id, "name", "");
                        updateItem(item.id, "fullPrice", 0);
                      } else {
                        selectProduct(item.id, value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou digite manualmente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Digitar manualmente</SelectItem>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.salePrice.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!item.productId && (
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <Input
                      placeholder="Nome do item"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    />
                  </div>
                )}

                <div className="w-full sm:w-28 space-y-2">
                  <Label className="text-xs text-muted-foreground">Preço Cheio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.fullPrice || ""}
                    onChange={(e) =>
                      updateItem(item.id, "fullPrice", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="w-full sm:w-20 space-y-2">
                  <Label className="text-xs text-muted-foreground">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {validItems.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Calculator className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Adicione itens para ver o cálculo do kit.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Item válido = nome ou produto selecionado + preço cheio {">"} 0 + qtd {">"}= 1
          </p>
        </div>
      ) : calculations.hasValidResults ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">Resultado do Cálculo</Label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-primary/5 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Preço Cheio</p>
              <p className="text-lg font-semibold text-foreground">
                R$ {calculations.kitFullPriceNum.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Preço Cliente</p>
              <p className="text-lg font-semibold text-success">
                R$ {calculations.kitPriceNum.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Desconto</p>
              <p className="text-lg font-semibold text-primary">
                {calculations.kitFullPriceNum > 0
                  ? (((calculations.kitFullPriceNum - calculations.kitPriceNum) / calculations.kitFullPriceNum) * 100).toFixed(1)
                  : "0.0"}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Loja</p>
              <p className="text-lg font-semibold text-warning">
                R$ {calculations.kitCostNum.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lucro / Margem</p>
              <p className="text-lg font-semibold text-success">
                R$ {calculations.totalProfit.toFixed(2)} ({calculations.totalMargin.toFixed(1)}%)
              </p>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Preço Cheio</TableHead>
                  <TableHead className="text-right">Preço no Kit</TableHead>
                  <TableHead className="text-right">Custo no Kit</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.productId && (
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        {item.name || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      R$ {item.itemTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-success font-semibold">
                      R$ {item.priceInKit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-warning">
                      R$ {item.costInKit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      R$ {item.profit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Save as Basket Section */}
          {onSaveAsBasket && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comboName">Nome do Produto (Combo) *</Label>
                <Input
                  id="comboName"
                  placeholder="Ex: Combo Perfumes Importados"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Este será o nome exibido no catálogo e nas vendas
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {validation.isValid ? (
                    <span className="flex items-center gap-2 text-success">
                      <ShoppingBasket className="w-4 h-4" />
                      Pronto para salvar como cesta
                    </span>
                  ) : (
                    <span className="flex items-start gap-2 text-warning">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        {validation.errors[0]}
                        {validation.errors.length > 1 && ` (+${validation.errors.length - 1})`}
                      </span>
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveAsBasket}
                  disabled={!validation.isValid || saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar como Cesta
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Calculator className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Preencha os campos obrigatórios para ver o cálculo.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Preço Cheio {">"} 0, Preço Cliente {">"} 0, Custo Loja {">"}= 0
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculadora de Kit (Promoção)
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Calculadora de Kit (Promoção)
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
