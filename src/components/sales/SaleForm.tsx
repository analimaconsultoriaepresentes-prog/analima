import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, User, UserPlus, Phone, Loader2, Store, Globe, X } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
import { CartItems, type CartItem } from "./CartItems";
import { DiscountBlock, type DiscountData, type DiscountType } from "./DiscountBlock";
import { PaymentMethodSelector, type PaymentMethod } from "./PaymentMethodSelector";
import { SaleTotals } from "./SaleTotals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Customer, CustomerFormData } from "@/hooks/useCustomers";
import type { SaleChannel } from "@/hooks/useSales";
import type { PackagingCosts } from "@/hooks/useStore";
import type { ProductType, GiftType } from "@/hooks/useProducts";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  salePrice: number;
  pricePix: number;
  priceCard: number;
  costPrice: number;
  stock: number;
  isBasket?: boolean;
  productType?: ProductType;
  cycle?: number;
  giftType?: GiftType;
  imageUrl?: string | null;
}

export interface SaleFormData {
  items: CartItem[];
  paymentMethod: string;
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountReason: string;
  total: number;
  amountReceived: number;
  changeAmount: number;
  estimatedProfit: number;
  customerId?: string;
  channel: SaleChannel;
}

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  customers: Customer[];
  onSubmit: (
    items: CartItem[], 
    paymentMethod: string, 
    total: number, 
    customerId?: string, 
    channel?: SaleChannel,
    saleData?: Partial<SaleFormData>
  ) => void;
  onAddCustomer: (data: CustomerFormData) => Promise<string | null>;
  defaultChannel?: SaleChannel;
  packagingCosts: PackagingCosts;
  showPhotos?: boolean;
}

function SaleFormContent({
  products,
  customers,
  onSubmit,
  onClose,
  onAddCustomer,
  defaultChannel = "store",
  packagingCosts,
  showPhotos = true,
}: Omit<SaleFormProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const isMobile = useIsMobile();
  const [channel, setChannel] = useState<SaleChannel>(defaultChannel);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [discount, setDiscount] = useState<DiscountData>({ type: "fixed", value: 0, reason: "" });
  const [amountReceived, setAmountReceived] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerBirthday, setNewCustomerBirthday] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    setChannel(defaultChannel);
  }, [defaultChannel]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  // Get the correct price based on payment method
  const getProductPrice = (product: Product) => {
    if (paymentMethod === "credito" || paymentMethod === "debito") {
      return product.priceCard || product.salePrice;
    }
    return product.pricePix || product.salePrice;
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0);
  }, [cart, paymentMethod]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (discount.value <= 0) return 0;
    if (discount.type === "percentage") {
      return subtotal * (discount.value / 100);
    }
    return Math.min(discount.value, subtotal);
  }, [discount, subtotal]);

  // Calculate total
  const total = Math.max(0, subtotal - discountAmount);

  // Calculate profit
  const profitData = useMemo(() => {
    let custoItens = 0;
    let looseItemCount = 0;

    for (const item of cart) {
      const qty = item.quantity;
      custoItens += (item.product.costPrice || 0) * qty;
      
      if (!item.product.isBasket) {
        looseItemCount += qty;
      }
    }

    let custoEmbalagem = 0;
    if (looseItemCount > 0) {
      if (looseItemCount <= 2) {
        custoEmbalagem = packagingCosts.packagingCost1Bag;
      } else if (looseItemCount <= 5) {
        custoEmbalagem = packagingCosts.packagingCost2Bags;
      } else {
        const bags = Math.ceil(looseItemCount / 3);
        custoEmbalagem = packagingCosts.packagingCost1Bag * bags;
      }
    }
    
    const custoTotal = custoItens + custoEmbalagem;
    const lucroReal = total - custoTotal;
    const margemReal = total > 0 ? (lucroReal / total) * 100 : 0;

    return { lucroReal, margemReal };
  }, [cart, total, packagingCosts]);

  // Calculate change
  const changeAmount = paymentMethod === "dinheiro" && amountReceived >= total 
    ? amountReceived - total 
    : 0;

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

    // For cash payments, validate amount received
    if (paymentMethod === "dinheiro" && amountReceived < total) {
      toast({
        title: "Valor insuficiente",
        description: "O valor recebido é menor que o total.",
        variant: "destructive",
      });
      return;
    }

    const saleData: Partial<SaleFormData> = {
      subtotal,
      discountType: discount.value > 0 ? discount.type : null,
      discountValue: discountAmount,
      discountReason: discount.reason,
      amountReceived: paymentMethod === "dinheiro" ? amountReceived : undefined,
      changeAmount: paymentMethod === "dinheiro" ? changeAmount : undefined,
      estimatedProfit: profitData.lucroReal,
    };

    // Map new payment methods to existing ones for backward compatibility
    let mappedPaymentMethod: string = paymentMethod;
    if (paymentMethod === "credito" || paymentMethod === "debito") {
      mappedPaymentMethod = "cartao";
    }

    onSubmit(cart, mappedPaymentMethod, total, selectedCustomerId || undefined, channel, saleData);
    
    // Reset form
    setCart([]);
    setPaymentMethod("");
    setDiscount({ type: "fixed", value: 0, reason: "" });
    setAmountReceived(0);
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
    });
    setSavingCustomer(false);

    if (customerId) {
      setSelectedCustomerId(customerId);
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerBirthday("");
    }
  };

  // Mobile layout - single column scrollable
  if (isMobile) {
    return (
      <div className="flex flex-col gap-6 pb-24">
        {/* Channel Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Canal de Venda</Label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setChannel("store")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                channel === "store"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Store className="w-4 h-4" />
              Loja
            </button>
            <button
              type="button"
              onClick={() => setChannel("online")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
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

        {/* Customer Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
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
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Cadastro rápido
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCustomerForm(false)}>
                  Cancelar
                </Button>
              </div>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nome do cliente *"
              />
              <Input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Telefone/WhatsApp *"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newCustomerBirthday}
                  onChange={(e) => setNewCustomerBirthday(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSaveNewCustomer}
                  disabled={savingCustomer || !newCustomerName.trim() || !newCustomerPhone.trim()}
                >
                  {savingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
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
              <Button type="button" variant="outline" onClick={() => setShowNewCustomerForm(true)}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Produtos</Label>
          <div className="border border-border rounded-xl p-3 max-h-[300px] overflow-hidden">
            <ProductGrid
              products={products}
              onSelectProduct={addToCart}
              showPhotos={showPhotos}
              paymentMethod={paymentMethod}
            />
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)} itens)
          </Label>
          <div className="border border-border rounded-xl p-3 max-h-[200px] overflow-y-auto">
            <CartItems
              items={cart}
              paymentMethod={paymentMethod}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              showPhotos={showPhotos}
            />
          </div>
        </div>

        {/* Discount */}
        {cart.length > 0 && (
          <DiscountBlock
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
          />
        )}

        {/* Payment Method */}
        {cart.length > 0 && (
          <PaymentMethodSelector
            total={total}
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
          />
        )}

        {/* Totals */}
        {cart.length > 0 && (
          <SaleTotals
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            profit={profitData.lucroReal}
            profitMargin={profitData.margemReal}
          />
        )}

        {/* Action Buttons - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex gap-3 z-50">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
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
    );
  }

  // Desktop layout - two columns
  return (
    <div className="flex gap-6 h-[calc(80vh-120px)] min-h-[500px]">
      {/* Left Column - Products */}
      <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-xl p-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          Produtos Disponíveis
        </h3>
        <div className="flex-1 overflow-hidden">
          <ProductGrid
            products={products}
            onSelectProduct={addToCart}
            showPhotos={showPhotos}
            paymentMethod={paymentMethod}
          />
        </div>
      </div>

      {/* Right Column - Cart & Checkout */}
      <div className="w-[420px] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Channel Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setChannel("store")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                channel === "store"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Store className="w-4 h-4" />
              Loja
            </button>
            <button
              type="button"
              onClick={() => setChannel("online")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                channel === "online"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Globe className="w-4 h-4" />
              Online
            </button>
          </div>

          {/* Customer Selection (Compact) */}
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedCustomer.name}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCustomerId("")}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 h-9"
                />
                {customerSearch && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-32 overflow-y-auto border border-border rounded-lg bg-card shadow-lg divide-y divide-border">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Nenhum encontrado
                      </div>
                    ) : (
                      filteredCustomers.slice(0, 5).map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="w-full p-2 hover:bg-muted/50 text-left"
                          onClick={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerSearch("");
                          }}
                        >
                          <p className="font-medium text-sm">{customer.name}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setShowNewCustomerForm(true)}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Quick Customer Form */}
          {showNewCustomerForm && (
            <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Novo Cliente</p>
                <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setShowNewCustomerForm(false)}>
                  Cancelar
                </Button>
              </div>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nome *"
                className="h-9"
              />
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Telefone *"
                  className="h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveNewCustomer}
                  disabled={savingCustomer || !newCustomerName.trim() || !newCustomerPhone.trim()}
                >
                  {savingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </div>
          )}

          {/* Cart */}
          <div className="border border-border rounded-xl p-3">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h4>
            <div className="max-h-[180px] overflow-y-auto">
              <CartItems
                items={cart}
                paymentMethod={paymentMethod}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                showPhotos={showPhotos}
              />
            </div>
          </div>

          {/* Discount */}
          {cart.length > 0 && (
            <DiscountBlock
              subtotal={subtotal}
              discount={discount}
              onDiscountChange={setDiscount}
            />
          )}

          {/* Payment Method */}
          {cart.length > 0 && (
            <PaymentMethodSelector
              total={total}
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              amountReceived={amountReceived}
              onAmountReceivedChange={setAmountReceived}
            />
          )}

          {/* Totals */}
          {cart.length > 0 && (
            <SaleTotals
              subtotal={subtotal}
              discountAmount={discountAmount}
              total={total}
              profit={profitData.lucroReal}
              profitMargin={profitData.margemReal}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border mt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
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
    </div>
  );
}

export function SaleForm({ 
  open, 
  onOpenChange, 
  products, 
  customers, 
  onSubmit, 
  onAddCustomer, 
  defaultChannel = "store",
  packagingCosts,
  showPhotos = true,
}: SaleFormProps) {
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
            <SaleFormContent 
              products={products} 
              customers={customers} 
              onSubmit={onSubmit} 
              onClose={handleClose} 
              onAddCustomer={onAddCustomer} 
              defaultChannel={defaultChannel}
              packagingCosts={packagingCosts}
              showPhotos={showPhotos}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
          <DialogDescription>Adicione produtos e finalize a venda.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <SaleFormContent 
            products={products} 
            customers={customers} 
            onSubmit={onSubmit} 
            onClose={handleClose} 
            onAddCustomer={onAddCustomer} 
            defaultChannel={defaultChannel}
            packagingCosts={packagingCosts}
            showPhotos={showPhotos}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
