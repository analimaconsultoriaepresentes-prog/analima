import { useState, useEffect } from "react";
import { Minus, Plus, ShoppingCart, Trash2, Search, User, UserPlus, Phone, Loader2, Store, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Customer, CustomerFormData } from "@/hooks/useCustomers";
import type { SaleChannel } from "@/hooks/useSales";

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
  customers: Customer[];
  onSubmit: (items: CartItem[], paymentMethod: string, total: number, customerId?: string, channel?: SaleChannel) => void;
  onAddCustomer: (data: CustomerFormData) => Promise<string | null>;
  defaultChannel?: SaleChannel;
}

const paymentMethods = [
  { value: "pix", label: "PIX", color: "bg-accent/10 text-accent" },
  { value: "dinheiro", label: "Dinheiro", color: "bg-success/10 text-success" },
  { value: "cartao", label: "Cartão", color: "bg-primary/10 text-primary" },
  { value: "fiado", label: "Fiado", color: "bg-warning/10 text-warning" },
];

function SaleFormContent({
  products,
  customers,
  onSubmit,
  onClose,
  onAddCustomer,
  defaultChannel = "store",
}: {
  products: Product[];
  customers: Customer[];
  onSubmit: (items: CartItem[], paymentMethod: string, total: number, customerId?: string, channel?: SaleChannel) => void;
  onClose: () => void;
  onAddCustomer: (data: CustomerFormData) => Promise<string | null>;
  defaultChannel?: SaleChannel;
}) {
  const isMobile = useIsMobile();
  const [channel, setChannel] = useState<SaleChannel>(defaultChannel);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerBirthday, setNewCustomerBirthday] = useState("");
  const [newCustomerNotes, setNewCustomerNotes] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Update channel when defaultChannel changes (e.g., when opening for online sale)
  useEffect(() => {
    setChannel(defaultChannel);
  }, [defaultChannel]);

  const availableProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
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

    onSubmit(cart, paymentMethod, total, selectedCustomerId || undefined, channel);
    setCart([]);
    setPaymentMethod("");
    setSearchTerm("");
    setSelectedCustomerId("");
    setCustomerSearch("");
    setChannel("store");
    onClose();
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSaveNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSavingCustomer(true);
    const customerId = await onAddCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      birthday: newCustomerBirthday || undefined,
      notes: newCustomerNotes.trim() || undefined,
    });
    setSavingCustomer(false);

    if (customerId) {
      setSelectedCustomerId(customerId);
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerBirthday("");
      setNewCustomerNotes("");
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Canal de Venda */}
      <div className="space-y-2">
        <Label className="block text-sm font-medium">Canal de Venda</Label>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setChannel("store")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors",
              channel === "store"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Store className="w-4 h-4" />
            Loja (Física)
          </button>
          <button
            type="button"
            onClick={() => setChannel("online")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors",
              channel === "online"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Globe className="w-4 h-4" />
            Online
          </button>
        </div>
      </div>

      {/* Cliente (opcional) */}
      <div className="space-y-2">
        <Label className="block text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Cliente (opcional)
        </Label>
        
        {selectedCustomer ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{selectedCustomer.name}</p>
                {selectedCustomer.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCustomerId("")}
              className="text-destructive hover:text-destructive"
            >
              Remover
            </Button>
          </div>
        ) : showNewCustomerForm ? (
          // Quick customer registration form
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Cadastro rápido
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewCustomerForm(false)}
              >
                Cancelar
              </Button>
            </div>
            
            <div className="grid gap-3">
              <div>
                <Label htmlFor="quick-name" className="text-xs">Nome *</Label>
                <Input
                  id="quick-name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quick-phone" className="text-xs">Telefone/WhatsApp *</Label>
                <Input
                  id="quick-phone"
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="quick-birthday" className="text-xs">Aniversário</Label>
                  <Input
                    id="quick-birthday"
                    type="date"
                    value={newCustomerBirthday}
                    onChange={(e) => setNewCustomerBirthday(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleSaveNewCustomer}
                    disabled={savingCustomer || !newCustomerName.trim() || !newCustomerPhone.trim()}
                    className="w-full"
                    size="sm"
                  >
                    {savingCustomer ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Customer search and buttons
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
                {customerSearch && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-32 overflow-y-auto border border-border rounded-lg bg-card shadow-lg divide-y divide-border">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Nenhum cliente encontrado
                      </div>
                    ) : (
                      filteredCustomers.slice(0, 5).map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="w-full p-3 flex items-center justify-between hover:bg-muted/50 text-left"
                          onClick={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerSearch("");
                          }}
                        >
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            {customer.phone && (
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size={isMobile ? "default" : "icon"}
                onClick={() => setShowNewCustomerForm(true)}
                className={cn(isMobile && "px-3")}
              >
                <UserPlus className="w-4 h-4" />
                {isMobile && <span className="ml-1">Novo</span>}
              </Button>
            </div>
          </div>
        )}
      </div>

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
        <div className="max-h-[160px] sm:max-h-[200px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
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

export function SaleForm({ open, onOpenChange, products, customers, onSubmit, onAddCustomer, defaultChannel = "store" }: SaleFormProps) {
  const isMobile = useIsMobile();

  const handleClose = () => {
    onOpenChange(false);
  };

  const header = (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-semibold">
        {defaultChannel === "online" ? "Venda Online" : "Nova Venda"}
      </span>
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
            <SaleFormContent products={products} customers={customers} onSubmit={onSubmit} onClose={handleClose} onAddCustomer={onAddCustomer} defaultChannel={defaultChannel} />
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
          <SaleFormContent products={products} customers={customers} onSubmit={onSubmit} onClose={handleClose} onAddCustomer={onAddCustomer} defaultChannel={defaultChannel} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
