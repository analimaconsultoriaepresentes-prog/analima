import { useState, useMemo } from "react";
import { ShoppingCart, User, UserPlus, Phone, Loader2, Store, Globe, X, Search, Heart } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
import { CartItems, type CartItem } from "./CartItems";
import { DiscountBlock, type DiscountData, type DiscountType } from "./DiscountBlock";
import { PaymentMethodSelector, type PaymentMethod } from "./PaymentMethodSelector";
import { SaleTotals } from "./SaleTotals";
import { RecordTypeSelector } from "./RecordTypeSelector";
import { DonationFields } from "./DonationFields";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSound } from "@/hooks/useSound";
import { Customer, CustomerFormData } from "@/hooks/useCustomers";
import type { SaleChannel, RecordType, DonationData } from "@/hooks/useSales";
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
  proveQty?: number;
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
  recordType: RecordType;
  donationData?: DonationData;
}

interface POSViewProps {
  products: Product[];
  customers: Customer[];
  onSubmit: (
    items: CartItem[], 
    paymentMethod: string, 
    total: number, 
    customerId?: string, 
    channel?: SaleChannel,
    saleData?: Partial<SaleFormData>,
    recordType?: RecordType,
    donationData?: DonationData
  ) => void;
  onAddCustomer: (data: CustomerFormData) => Promise<string | null>;
  packagingCosts: PackagingCosts;
  showPhotos?: boolean;
}

export function POSView({
  products,
  customers,
  onSubmit,
  onAddCustomer,
  packagingCosts,
  showPhotos = true,
}: POSViewProps) {
  const isMobile = useIsMobile();
  const { playActionTick, playSaleSuccess, playErrorToc } = useSound();
  const [recordType, setRecordType] = useState<RecordType>("sale");
  const [channel, setChannel] = useState<SaleChannel>("store");
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
  
  // Donation fields
  const [donationNotes, setDonationNotes] = useState("");
  const [donationRecipient, setDonationRecipient] = useState("");
  const [donationReferenceValue, setDonationReferenceValue] = useState("");

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

    return { lucroReal, margemReal, custoTotal };
  }, [cart, total, packagingCosts]);

  // Calculate change
  const changeAmount = paymentMethod === "dinheiro" && amountReceived >= total 
    ? amountReceived - total 
    : 0;

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        playErrorToc();
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
    playActionTick(); // Sound when adding to cart
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > item.product.stock) {
              playErrorToc();
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

  const resetForm = () => {
    setCart([]);
    setPaymentMethod("");
    setDiscount({ type: "fixed", value: 0, reason: "" });
    setAmountReceived(0);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setChannel("store");
    setRecordType("sale");
    setDonationNotes("");
    setDonationRecipient("");
    setDonationReferenceValue("");
  };

  const handleSubmit = () => {
    if (cart.length === 0) {
      playErrorToc();
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos para registrar.",
        variant: "destructive",
      });
      return;
    }

    // For sales, require payment method
    if (recordType === "sale" && !paymentMethod) {
      playErrorToc();
      toast({
        title: "Pagamento",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    // For sales with cash, validate amount received
    if (recordType === "sale" && paymentMethod === "dinheiro" && amountReceived < total) {
      playErrorToc();
      toast({
        title: "Valor insuficiente",
        description: "O valor recebido é menor que o total.",
        variant: "destructive",
      });
      return;
    }

    // For donations, require notes
    if (recordType === "donation" && !donationNotes.trim()) {
      playErrorToc();
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da doação.",
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
      recordType,
    };

    // Map new payment methods to existing ones for backward compatibility
    let mappedPaymentMethod: string = paymentMethod || "pix";
    if (paymentMethod === "credito" || paymentMethod === "debito") {
      mappedPaymentMethod = "cartao";
    }

    // Prepare donation data if applicable
    const donationData: DonationData | undefined = recordType === "donation" ? {
      notes: donationNotes.trim(),
      recipient: donationRecipient.trim() || undefined,
      referenceValue: donationReferenceValue ? parseFloat(donationReferenceValue) : undefined,
    } : undefined;

    onSubmit(
      cart, 
      mappedPaymentMethod, 
      total, 
      selectedCustomerId || undefined, 
      channel, 
      saleData,
      recordType,
      donationData
    );
    
    // Play success sound
    playSaleSuccess();
    
    // Reset form after successful sale
    resetForm();
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
      <div className="flex flex-col gap-4 pb-4">
        {/* Record Type Selector */}
        <RecordTypeSelector
          recordType={recordType}
          onRecordTypeChange={setRecordType}
        />

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

        {/* Customer Selection */}
        <CustomerSelection
          selectedCustomer={selectedCustomer}
          onClear={() => setSelectedCustomerId("")}
          showNewCustomerForm={showNewCustomerForm}
          onToggleForm={setShowNewCustomerForm}
          customerSearch={customerSearch}
          onSearchChange={setCustomerSearch}
          filteredCustomers={filteredCustomers}
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCustomerSearch("");
          }}
          newCustomerName={newCustomerName}
          onNameChange={setNewCustomerName}
          newCustomerPhone={newCustomerPhone}
          onPhoneChange={setNewCustomerPhone}
          newCustomerBirthday={newCustomerBirthday}
          onBirthdayChange={setNewCustomerBirthday}
          savingCustomer={savingCustomer}
          onSaveCustomer={handleSaveNewCustomer}
        />

        {/* Products */}
        <div className="border border-border rounded-xl p-3 h-[300px] overflow-hidden">
          <ProductGrid
            products={products}
            onSelectProduct={addToCart}
            showPhotos={showPhotos}
            paymentMethod={paymentMethod}
          />
        </div>

        {/* Cart */}
        <div className="border border-border rounded-xl p-3">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </h4>
          <div className="max-h-[200px] overflow-y-auto">
            <CartItems
              items={cart}
              paymentMethod={paymentMethod}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              showPhotos={showPhotos}
            />
          </div>
        </div>

        {/* Donation Fields - Only show for donations */}
        {recordType === "donation" && cart.length > 0 && (
          <DonationFields
            notes={donationNotes}
            onNotesChange={setDonationNotes}
            recipient={donationRecipient}
            onRecipientChange={setDonationRecipient}
            referenceValue={donationReferenceValue}
            onReferenceValueChange={setDonationReferenceValue}
          />
        )}

        {/* Discount - Only for sales */}
        {recordType === "sale" && cart.length > 0 && (
          <DiscountBlock
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
          />
        )}

        {/* Payment Method - Only for sales */}
        {recordType === "sale" && cart.length > 0 && (
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
            discountAmount={recordType === "sale" ? discountAmount : 0}
            total={recordType === "sale" ? total : 0}
            profit={recordType === "sale" ? profitData.lucroReal : -profitData.custoTotal}
            profitMargin={recordType === "sale" ? profitData.margemReal : 0}
            isDonation={recordType === "donation"}
            costTotal={profitData.custoTotal}
          />
        )}

        {/* Submit Button */}
        <Button
          type="button"
          className={cn(
            "w-full py-6 text-lg",
            recordType === "donation" 
              ? "bg-accent hover:bg-accent/90 text-accent-foreground" 
              : "btn-primary"
          )}
          onClick={handleSubmit}
          disabled={cart.length === 0 || (recordType === "sale" && !paymentMethod)}
        >
          {recordType === "donation" ? (
            <>
              <Heart className="w-5 h-5 mr-2" />
              Registrar Doação
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Registrar Venda
            </>
          )}
        </Button>
      </div>
    );
  }

  // Desktop layout - two columns
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Left Column - Products */}
      <div className="flex-1 flex flex-col overflow-hidden bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Produtos Disponíveis</h3>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <ProductGrid
            products={products}
            onSelectProduct={addToCart}
            showPhotos={showPhotos}
            paymentMethod={paymentMethod}
          />
        </div>
      </div>

      {/* Right Column - Cart & Checkout */}
      <div className="w-[400px] flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {recordType === "donation" ? (
              <>
                <Heart className="w-5 h-5 text-accent" />
                Doação
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 text-primary" />
                Carrinho
              </>
            )}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Record Type Selector */}
          <RecordTypeSelector
            recordType={recordType}
            onRecordTypeChange={setRecordType}
          />

          {/* Channel Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setChannel("store")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
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
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
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
          <CustomerSelection
            selectedCustomer={selectedCustomer}
            onClear={() => setSelectedCustomerId("")}
            showNewCustomerForm={showNewCustomerForm}
            onToggleForm={setShowNewCustomerForm}
            customerSearch={customerSearch}
            onSearchChange={setCustomerSearch}
            filteredCustomers={filteredCustomers}
            onSelectCustomer={(id) => {
              setSelectedCustomerId(id);
              setCustomerSearch("");
            }}
            newCustomerName={newCustomerName}
            onNameChange={setNewCustomerName}
            newCustomerPhone={newCustomerPhone}
            onPhoneChange={setNewCustomerPhone}
            newCustomerBirthday={newCustomerBirthday}
            onBirthdayChange={setNewCustomerBirthday}
            savingCustomer={savingCustomer}
            onSaveCustomer={handleSaveNewCustomer}
            compact
          />

          {/* Cart Items */}
          <div className="border border-border rounded-xl p-3">
            <div className="text-sm text-muted-foreground mb-2">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
            </div>
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

          {/* Donation Fields - Only show for donations */}
          {recordType === "donation" && cart.length > 0 && (
            <DonationFields
              notes={donationNotes}
              onNotesChange={setDonationNotes}
              recipient={donationRecipient}
              onRecipientChange={setDonationRecipient}
              referenceValue={donationReferenceValue}
              onReferenceValueChange={setDonationReferenceValue}
              compact
            />
          )}

          {/* Discount - Only for sales */}
          {recordType === "sale" && cart.length > 0 && (
            <DiscountBlock
              subtotal={subtotal}
              discount={discount}
              onDiscountChange={setDiscount}
            />
          )}

          {/* Payment Method - Only for sales */}
          {recordType === "sale" && cart.length > 0 && (
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
              discountAmount={recordType === "sale" ? discountAmount : 0}
              total={recordType === "sale" ? total : 0}
              profit={recordType === "sale" ? profitData.lucroReal : -profitData.custoTotal}
              profitMargin={recordType === "sale" ? profitData.margemReal : 0}
              isDonation={recordType === "donation"}
              costTotal={profitData.custoTotal}
            />
          )}
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="p-4 border-t border-border">
          <Button
            type="button"
            className={cn(
              "w-full py-5 text-base",
              recordType === "donation" 
                ? "bg-accent hover:bg-accent/90 text-accent-foreground" 
                : "btn-primary"
            )}
            onClick={handleSubmit}
            disabled={cart.length === 0 || (recordType === "sale" && !paymentMethod)}
          >
            {recordType === "donation" ? (
              <>
                <Heart className="w-5 h-5 mr-2" />
                Registrar Doação
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Registrar Venda
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Customer Selection Component
interface CustomerSelectionProps {
  selectedCustomer: Customer | undefined;
  onClear: () => void;
  showNewCustomerForm: boolean;
  onToggleForm: (show: boolean) => void;
  customerSearch: string;
  onSearchChange: (value: string) => void;
  filteredCustomers: Customer[];
  onSelectCustomer: (id: string) => void;
  newCustomerName: string;
  onNameChange: (value: string) => void;
  newCustomerPhone: string;
  onPhoneChange: (value: string) => void;
  newCustomerBirthday: string;
  onBirthdayChange: (value: string) => void;
  savingCustomer: boolean;
  onSaveCustomer: () => void;
  compact?: boolean;
}

function CustomerSelection({
  selectedCustomer,
  onClear,
  showNewCustomerForm,
  onToggleForm,
  customerSearch,
  onSearchChange,
  filteredCustomers,
  onSelectCustomer,
  newCustomerName,
  onNameChange,
  newCustomerPhone,
  onPhoneChange,
  newCustomerBirthday,
  onBirthdayChange,
  savingCustomer,
  onSaveCustomer,
  compact = false,
}: CustomerSelectionProps) {
  if (selectedCustomer) {
    return (
      <div className={cn(
        "flex items-center justify-between rounded-lg bg-muted/50 border border-border",
        compact ? "p-2" : "p-3"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center",
            compact ? "w-8 h-8" : "w-10 h-10"
          )}>
            <User className={cn("text-primary", compact ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          <div>
            <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>{selectedCustomer.name}</p>
            {!compact && selectedCustomer.phone && (
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
          size={compact ? "icon" : "sm"}
          onClick={onClear}
          className={cn(
            "text-muted-foreground hover:text-destructive",
            compact ? "h-8 w-8" : ""
          )}
        >
          <X className="w-4 h-4" />
          {!compact && <span className="ml-1">Remover</span>}
        </Button>
      </div>
    );
  }

  if (showNewCustomerForm) {
    return (
      <div className={cn(
        "space-y-2 rounded-lg border border-border bg-muted/30",
        compact ? "p-3" : "p-4"
      )}>
        <div className="flex items-center justify-between">
          <p className={cn("font-medium flex items-center gap-2", compact ? "text-sm" : "")}>
            <UserPlus className="w-4 h-4 text-primary" />
            {compact ? "Novo Cliente" : "Cadastro rápido"}
          </p>
          <Button type="button" variant="ghost" size="sm" className={compact ? "h-7" : ""} onClick={() => onToggleForm(false)}>
            Cancelar
          </Button>
        </div>
        <Input
          value={newCustomerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nome do cliente *"
          className={compact ? "h-9" : ""}
        />
        <Input
          type="tel"
          value={newCustomerPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Telefone/WhatsApp *"
          className={compact ? "h-9" : ""}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={newCustomerBirthday}
            onChange={(e) => onBirthdayChange(e.target.value)}
            className={cn("flex-1", compact ? "h-9" : "")}
          />
          <Button
            type="button"
            size={compact ? "sm" : "default"}
            onClick={onSaveCustomer}
            disabled={savingCustomer || !newCustomerName.trim() || !newCustomerPhone.trim()}
          >
            {savingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={customerSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn("pl-10", compact ? "h-9" : "")}
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
                  onClick={() => onSelectCustomer(customer.id)}
                >
                  <p className="font-medium text-sm">{customer.name}</p>
                  {customer.phone && (
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <Button 
        type="button" 
        variant="outline" 
        size={compact ? "icon" : "default"} 
        className={compact ? "h-9 w-9" : ""} 
        onClick={() => onToggleForm(true)}
      >
        <UserPlus className="w-4 h-4" />
      </Button>
    </div>
  );
}