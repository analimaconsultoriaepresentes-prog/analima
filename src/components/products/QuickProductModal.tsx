import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormData } from "@/hooks/useProducts";

interface QuickProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    name: string;
    salePrice: number;
    costPrice: number;
  };
  onSave: (data: ProductFormData) => Promise<string | null>;
  onSuccess: (productId: string, productName: string, salePrice: number) => void;
}

const CATEGORIES = ["Presente", "Perfume", "Cosmético", "Utensílios"] as const;

export function QuickProductModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  onSuccess,
}: QuickProductModalProps) {
  const [name, setName] = useState(initialData.name);
  const [category, setCategory] = useState<typeof CATEGORIES[number] | "">("");
  const [salePrice, setSalePrice] = useState(initialData.salePrice.toString());
  const [costPrice, setCostPrice] = useState(initialData.costPrice.toString());
  const [stock, setStock] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !category) return;

    setSaving(true);
    try {
      const productData: ProductFormData = {
        name: name.trim(),
        category,
        brand: "",
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        stock: parseInt(stock) || 0,
        origin: "purchased",
        isBasket: false,
        packagingCost: 0,
        productType: "item",
        packagingQty: 1,
      };

      const productId = await onSave(productData);
      
      if (productId) {
        onSuccess(productId, productData.name, productData.salePrice);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim().length > 0 && category !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Criar Produto Rápido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="productName">Nome do Produto *</Label>
            <Input
              id="productName"
              placeholder="Nome do produto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof CATEGORIES[number])}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Preço de Venda</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Preço de Custo</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Estoque Inicial</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opcional, default = 0
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid || saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Criar Produto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
