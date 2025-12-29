import { useState, useMemo } from "react";
import { Calculator, Plus, Trash2, Package, Save, Loader2, ShoppingBasket } from "lucide-react";
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
  const [kitPrice, setKitPrice] = useState("");
  const [kitCost, setKitCost] = useState("");
  const [items, setItems] = useState<KitItem[]>([]);
  const [saving, setSaving] = useState(false);

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

  const calculations = useMemo(() => {
    const kitPriceNum = parseFloat(kitPrice) || 0;
    const kitCostNum = parseFloat(kitCost) || 0;
    const hasCost = kitCost !== "" && kitCostNum > 0;

    const totalFullPrice = items.reduce(
      (sum, item) => sum + item.fullPrice * item.quantity,
      0
    );

    if (totalFullPrice === 0 || kitPriceNum === 0) {
      return { items: [], totalFullPrice, kitPriceNum, kitCostNum, hasCost };
    }

    const calculatedItems = items.map((item) => {
      const itemTotal = item.fullPrice * item.quantity;
      const proportion = itemTotal / totalFullPrice;
      const priceInKit = kitPriceNum * proportion;
      const costInKit = hasCost ? kitCostNum * proportion : null;

      return {
        ...item,
        itemTotal,
        proportion,
        priceInKit,
        costInKit,
      };
    });

    return {
      items: calculatedItems,
      totalFullPrice,
      kitPriceNum,
      kitCostNum,
      hasCost,
    };
  }, [items, kitPrice, kitCost]);

  // Check if we can save as basket (all items must have productId)
  const canSaveAsBasket = useMemo(() => {
    if (!kitName.trim() || !kitPrice || parseFloat(kitPrice) <= 0) return false;
    if (items.length === 0) return false;
    // All items must be linked to existing products
    return items.every((item) => item.productId);
  }, [kitName, kitPrice, items]);

  const handleSaveAsBasket = async () => {
    if (!onSaveAsBasket || !canSaveAsBasket) return;

    setSaving(true);
    try {
      const kitPriceNum = parseFloat(kitPrice) || 0;
      const kitCostNum = parseFloat(kitCost) || 0;

      const basketData: ProductFormData = {
        name: kitName.trim(),
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

      const basketItems = items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId!,
          quantity: item.quantity,
        }));

      await onSaveAsBasket(basketData, basketItems);
      
      toast({
        title: "Cesta criada com sucesso!",
        description: `"${kitName}" foi salva como cesta/combo.`,
      });

      handleClose();
    } catch (error) {
      console.error("Error saving basket:", error);
      toast({
        title: "Erro ao salvar cesta",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setKitName("");
    setKitPrice("");
    setKitCost("");
    setItems([]);
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Kit Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kitName">Nome do Kit *</Label>
          <Input
            id="kitName"
            placeholder="Ex: Kit Perfumes"
            value={kitName}
            onChange={(e) => setKitName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kitPrice">Preço Promocional *</Label>
          <Input
            id="kitPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={kitPrice}
            onChange={(e) => setKitPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kitCost">Custo do Kit (opcional)</Label>
          <Input
            id="kitCost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={kitCost}
            onChange={(e) => setKitCost(e.target.value)}
          />
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

      {/* Results Table */}
      {calculations.items.length > 0 && calculations.kitPriceNum > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">Resultado do Cálculo</Label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Cheio</p>
              <p className="text-lg font-semibold text-foreground">
                R$ {calculations.totalFullPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Preço Kit</p>
              <p className="text-lg font-semibold text-success">
                R$ {calculations.kitPriceNum.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Desconto</p>
              <p className="text-lg font-semibold text-primary">
                {(
                  ((calculations.totalFullPrice - calculations.kitPriceNum) /
                    calculations.totalFullPrice) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
            {calculations.hasCost && (
              <div>
                <p className="text-xs text-muted-foreground">Custo Kit</p>
                <p className="text-lg font-semibold text-warning">
                  R$ {calculations.kitCostNum.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Preço Cheio</TableHead>
                  <TableHead className="text-right">Preço no Kit</TableHead>
                  {calculations.hasCost && (
                    <TableHead className="text-right">Custo</TableHead>
                  )}
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
                    {calculations.hasCost && (
                      <TableCell className="text-right text-warning">
                        R$ {item.costInKit?.toFixed(2)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {calculations.hasCost && (
            <div className="p-4 bg-success/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Lucro Estimado do Kit</p>
              <p className="text-xl font-bold text-success">
                R$ {(calculations.kitPriceNum - calculations.kitCostNum).toFixed(2)}
              </p>
            </div>
          )}

          {/* Save as Basket Button */}
          {onSaveAsBasket && (
            <div className="pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {canSaveAsBasket ? (
                    <span className="flex items-center gap-2 text-success">
                      <ShoppingBasket className="w-4 h-4" />
                      Pronto para salvar como cesta
                    </span>
                  ) : (
                    <span className="text-warning">
                      Para salvar, todos os itens devem ser produtos cadastrados
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveAsBasket}
                  disabled={!canSaveAsBasket || saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar como Cesta
                </Button>
              </div>
            </div>
          )}
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
