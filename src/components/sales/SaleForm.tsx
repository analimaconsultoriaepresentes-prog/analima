import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function SaleForm({ open, onOpenChange, products, onSubmit }: SaleFormProps) {
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
          description: `Só há ${product.stock} unidades disponíveis.`,
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
                description: `Só há ${item.product.stock} unidades disponíveis.`,
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
        description: "Adicione produtos para registrar a venda.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Forma de pagamento",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(cart, paymentMethod, total);
    setCart([]);
    setPaymentMethod("");
    setSearchTerm("");
    onOpenChange(false);
    toast({
      title: "Venda registrada!",
      description: `Venda de R$ ${total.toLocaleString("pt-BR")} realizada com sucesso.`,
    });
  };

  const handleClose = () => {
    setCart([]);
    setPaymentMethod("");
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            Nova Venda
          </DialogTitle>
          <DialogDescription>
            Selecione os produtos e a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Busca de produtos */}
          <div>
            <Label>Buscar Produto</Label>
            <Input
              placeholder="Digite o nome ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-styled mt-1.5"
            />
          </div>

          {/* Lista de produtos disponíveis */}
          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {availableProducts.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Nenhum produto encontrado
                </div>
              ) : (
                availableProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.brand} • {product.stock} em estoque
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">
                        R$ {product.salePrice.toFixed(2)}
                      </p>
                      <Button size="sm" variant="ghost" className="h-6 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Carrinho */}
          <div className="flex-1 overflow-hidden">
            <Label className="mb-2 block">
              Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
            </Label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {cart.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  Nenhum produto adicionado
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 flex items-center justify-between"
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
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="w-20 text-right font-semibold text-foreground">
                        R$ {(item.product.salePrice * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
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
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="input-styled mt-1.5">
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
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 btn-primary"
              onClick={handleSubmit}
              disabled={cart.length === 0 || !paymentMethod}
            >
              Registrar Venda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
