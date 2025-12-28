import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  salePrice: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSubmit: (items: CartItem[], paymentMethod: string, total: number) => void;
}

const paymentMethods = [
  { value: "pix", label: "PIX", color: "bg-accent/10 text-accent" },
  { value: "dinheiro", label: "Dinheiro", color: "bg-success/10 text-success" },
  { value: "cartao", label: "Cartão", color: "bg-primary/10 text-primary" },
  { value: "fiado", label: "Fiado", color: "bg-warning/10 text-warning" },
];

function SaleFormContent({
  products,
  onSubmit,
  onClose,
}: {
  products: Product[];
  onSubmit: (items: CartItem[], paymentMethod: string, total: number) => void;
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const availableProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Estoque insuficiente",
          description: `Só há ${product.stock} unidades.`,
          variant: "destructive",
        });
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setSearchTerm("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > item.product.stock) {
              toast({
                title: "Estoque insuficiente",
                description: `Só há ${item.product.stock} unidades.`,
                variant: "destructive",
              });
              return item;
            }
            return { ...item, quantity: Math.max(0, newQuantity) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0
  );

  const handleSubmit = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos para registrar.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Pagamento",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(cart, paymentMethod, total);
    setCart([]);
    setPaymentMethod("");
    setSearchTerm("");
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Busca de produtos */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-styled pl-10 min-h-[48px] text-base"
          autoFocus
        />
      </div>

      {/* Lista de produtos disponíveis */}
      {searchTerm && (
        <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
          {availableProducts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum produto encontrado
            </div>
          ) : (
            availableProducts.slice(0, 5).map((product) => (
              <button
                key={product.id}
                type="button"
                className="w-full p-3 flex items-center justify-between hover:bg-muted/50 active:bg-muted transition-colors text-left min-h-[56px]"
                onClick={() => addToCart(product)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.brand} • {product.stock} un.
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="font-semibold text-success">
                    R$ {product.salePrice.toFixed(2)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Carrinho */}
      <div className="flex-1 overflow-hidden">
        <Label className="mb-2 block text-sm font-medium">
          Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
        </Label>
        <div className="max-h-[200px] sm:max-h-[240px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
          {cart.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Adicione produtos
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    R$ {item.product.salePrice.toFixed(2)} cada
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted rounded-lg">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="w-16 text-right font-semibold text-sm">
                    R$ {(item.product.salePrice * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Forma de pagamento */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Pagamento</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="input-styled min-h-[48px] text-base">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", method.color)}>
                  {method.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Total */}
      <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
        <span className="text-lg font-medium text-foreground">Total</span>
        <span className="text-2xl font-bold text-success">
          R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Botões */}
      <div className="flex gap-3 sticky bottom-0 bg-card pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-h-[48px] text-base"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1 btn-primary min-h-[48px] text-base"
          onClick={handleSubmit}
          disabled={cart.length === 0 || !paymentMethod}
        >
          Registrar
        </Button>
      </div>
    </div>
  );
}

export function SaleForm({ open, onOpenChange, products, onSubmit }: SaleFormProps) {
  const isMobile = useIsMobile();

  const handleClose = () => {
    onOpenChange(false);
  };

  const header = (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-semibold">Nova Venda</span>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{header}</DrawerTitle>
            <DrawerDescription>Adicione produtos e finalize a venda.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto flex-1">
            <SaleFormContent products={products} onSubmit={onSubmit} onClose={handleClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
          <DialogDescription>Adicione produtos e finalize a venda.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <SaleFormContent products={products} onSubmit={onSubmit} onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
