import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package, Percent, Gift, ShoppingBasket, Box, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { BasketCompositionForm, type BasketItemInput, type BasketExtraInput } from "./BasketCompositionForm";
import type { Product, ProductFormData, ProductType } from "@/hooks/useProducts";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  category: z.enum(["Presente", "Perfume", "Cosmético", "Utensílios"], {
    required_error: "Selecione uma categoria",
  }),
  brand: z.string().min(1, "Informe a marca").max(50, "Marca muito longa"),
  costPrice: z.coerce.number().min(0, "Preço de custo não pode ser negativo"),
  salePrice: z.coerce.number().min(0.01, "Preço de venda deve ser maior que zero"),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  expiryDate: z.date().optional(),
  origin: z.enum(["purchased", "gift"]),
  cycle: z.coerce.number().int().min(1, "Ciclo deve ser maior que zero").optional().or(z.literal("")),
  isBasket: z.boolean(),
  packagingCost: z.coerce.number().min(0, "Custo de embalagem não pode ser negativo"),
  productType: z.enum(["item", "packaging", "extra", "basket"]),
  packagingProductId: z.string().optional(),
  packagingQty: z.coerce.number().int().min(1, "Quantidade deve ser maior que zero"),
}).refine((data) => {
  // For baskets, sale price just needs to be > 0
  if (data.isBasket) {
    return data.salePrice > 0;
  }
  // For packaging/extra, just need sale price > 0
  if (data.productType === "packaging" || data.productType === "extra") {
    return data.salePrice > 0;
  }
  // For gifts (cost = 0), only require sale price > 0
  if (data.origin === "gift") {
    return data.salePrice > 0;
  }
  // For purchased products, require sale price > cost price
  return data.salePrice > data.costPrice;
}, {
  message: "Preço de venda deve ser maior que o preço de custo",
  path: ["salePrice"],
});

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData, basketItems?: BasketItemInput[], basketExtras?: BasketExtraInput[]) => void;
  editProduct?: Product | null;
  availableProducts?: Product[];
  initialBasketItems?: BasketItemInput[];
  initialBasketExtras?: BasketExtraInput[];
}

function ProductFormContent({ 
  form, 
  onSubmit, 
  onCancel, 
  editProduct,
  availableProducts = [],
  initialBasketItems = [],
  initialBasketExtras = [],
}: { 
  form: ReturnType<typeof useForm<ProductFormData>>; 
  onSubmit: (data: ProductFormData, basketItems?: BasketItemInput[], basketExtras?: BasketExtraInput[]) => void;
  onCancel: () => void;
  editProduct?: Product | null;
  availableProducts?: Product[];
  initialBasketItems?: BasketItemInput[];
  initialBasketExtras?: BasketExtraInput[];
}) {
  const [desiredMargin, setDesiredMargin] = useState<string>("");
  const isManualSalePriceEdit = useRef(false);
  const [basketItems, setBasketItems] = useState<BasketItemInput[]>([]);
  const [basketExtras, setBasketExtras] = useState<BasketExtraInput[]>([]);
  const [basketPackagingProductId, setBasketPackagingProductId] = useState<string | undefined>();
  const [basketPackagingQty, setBasketPackagingQty] = useState<number>(1);
  const [basketDesiredMargin, setBasketDesiredMargin] = useState<number>(50);
  
  const costPrice = form.watch("costPrice");
  const salePrice = form.watch("salePrice");
  const origin = form.watch("origin");
  const isBasket = form.watch("isBasket");
  const productType = form.watch("productType");
  
  const isGift = origin === "gift";
  const isPackagingOrExtra = productType === "packaging" || productType === "extra";

  // Initialize basket items when editing
  useEffect(() => {
    if (initialBasketItems.length > 0) {
      setBasketItems(initialBasketItems);
    } else {
      setBasketItems([]);
    }
  }, [initialBasketItems]);

  // Initialize basket extras when editing
  useEffect(() => {
    if (initialBasketExtras.length > 0) {
      setBasketExtras(initialBasketExtras);
    } else {
      setBasketExtras([]);
    }
  }, [initialBasketExtras]);

  // Initialize packaging when editing a basket
  useEffect(() => {
    if (editProduct?.isBasket) {
      setBasketPackagingProductId(editProduct.packagingProductId);
      setBasketPackagingQty(editProduct.packagingQty || 1);
      // Calculate margin from existing prices
      if (editProduct.costPrice > 0 && editProduct.salePrice > editProduct.costPrice) {
        const existingMargin = ((editProduct.salePrice - editProduct.costPrice) / editProduct.costPrice) * 100;
        setBasketDesiredMargin(Math.round(existingMargin * 10) / 10);
      }
    } else {
      setBasketPackagingProductId(undefined);
      setBasketPackagingQty(1);
      setBasketDesiredMargin(50);
    }
  }, [editProduct]);

  // Get the selected packaging product for cost calculation
  const selectedPackaging = useMemo(() => {
    if (!basketPackagingProductId) return null;
    return availableProducts.find((p) => p.id === basketPackagingProductId);
  }, [availableProducts, basketPackagingProductId]);

  // Calculate basket costs
  const basketCosts = useMemo(() => {
    const totalItemsCost = basketItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    const packagingCost = selectedPackaging ? selectedPackaging.costPrice * basketPackagingQty : 0;
    const totalExtrasCost = basketExtras.reduce((sum, extra) => sum + extra.unitCost * extra.quantity, 0);
    const totalCost = totalItemsCost + packagingCost + totalExtrasCost;
    return { totalItemsCost, packagingCost, totalExtrasCost, totalCost };
  }, [basketItems, basketExtras, selectedPackaging, basketPackagingQty]);
  
  // Track if basket composition has changed from initial state
  const hasBasketChanged = useMemo(() => {
    if (basketItems.length !== initialBasketItems.length) return true;
    if (basketExtras.length !== initialBasketExtras.length) return true;
    return basketItems.some((item) => {
      const initial = initialBasketItems.find(i => i.productId === item.productId);
      return !initial || initial.quantity !== item.quantity;
    });
  }, [basketItems, basketExtras, initialBasketItems, initialBasketExtras]);

  // Update form values when basket composition changes
  useEffect(() => {
    if (isBasket) {
      form.setValue("costPrice", basketCosts.totalCost, { shouldValidate: true });
      form.setValue("packagingCost", basketCosts.packagingCost, { shouldValidate: true });
      form.setValue("packagingProductId", basketPackagingProductId, { shouldValidate: true });
      form.setValue("packagingQty", basketPackagingQty, { shouldValidate: true });
      
      // Recalculate price when composition changes
      if (basketDesiredMargin > 0 && basketCosts.totalCost > 0 && (!editProduct?.isBasket || hasBasketChanged)) {
        const suggestedPrice = basketCosts.totalCost * (1 + basketDesiredMargin / 100);
        form.setValue("salePrice", Math.round(suggestedPrice * 100) / 100, { shouldValidate: true });
      }
    }
  }, [isBasket, basketCosts, basketDesiredMargin, basketPackagingProductId, basketPackagingQty, form, editProduct?.isBasket, hasBasketChanged]);

  // Reset basket items when switching to non-basket (only for new products)
  useEffect(() => {
    if (!isBasket && !editProduct) {
      setBasketItems([]);
      setBasketExtras([]);
      setBasketPackagingProductId(undefined);
      setBasketPackagingQty(1);
    }
  }, [isBasket, editProduct]);

  // Sync productType with isBasket
  useEffect(() => {
    if (isBasket && productType !== "basket") {
      form.setValue("productType", "basket");
    } else if (!isBasket && productType === "basket") {
      form.setValue("productType", "item");
    }
  }, [isBasket, productType, form]);
  
  // Auto-set cost to 0 when origin changes to gift
  useEffect(() => {
    if (isGift && !isBasket && !isPackagingOrExtra) {
      form.setValue("costPrice", 0, { shouldValidate: true });
      setDesiredMargin("");
    }
  }, [isGift, isBasket, isPackagingOrExtra, form]);
  
  // Calculate actual margin for display
  const actualMargin = salePrice > 0 && costPrice > 0 && salePrice > costPrice
    ? ((salePrice - costPrice) / costPrice * 100).toFixed(1)
    : "0.0";
  
  const profit = salePrice > costPrice ? (salePrice - costPrice).toFixed(2) : "0.00";

  // Auto-calculate sale price when cost or desired margin changes (for non-baskets)
  useEffect(() => {
    if (isBasket) return;
    if (isManualSalePriceEdit.current) {
      isManualSalePriceEdit.current = false;
      return;
    }
    
    const marginValue = parseFloat(desiredMargin);
    if (!isNaN(marginValue) && marginValue > 0 && costPrice > 0) {
      const calculatedSalePrice = costPrice * (1 + marginValue / 100);
      const roundedPrice = Math.round(calculatedSalePrice * 100) / 100;
      form.setValue("salePrice", roundedPrice, { shouldValidate: true });
    }
  }, [costPrice, desiredMargin, form, isBasket]);

  // Initialize desired margin when editing a product
  useEffect(() => {
    if (editProduct && !editProduct.isBasket && costPrice > 0 && salePrice > costPrice) {
      const calculatedMargin = ((salePrice - costPrice) / costPrice * 100).toFixed(1);
      setDesiredMargin(calculatedMargin);
    }
  }, [editProduct]);

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: number) => void) => {
    isManualSalePriceEdit.current = true;
    const value = parseFloat(e.target.value) || 0;
    onChange(value);
    
    // Update desired margin based on manual input
    if (value > 0 && costPrice > 0 && value > costPrice) {
      const newMargin = ((value - costPrice) / costPrice * 100).toFixed(1);
      setDesiredMargin(newMargin);
    }
  };

  const handleDesiredMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDesiredMargin(value);
  };

  function handleSubmit(data: ProductFormData) {
    onSubmit(data, isBasket ? basketItems : undefined, isBasket ? basketExtras : undefined);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-5">
        {/* Tipo de Produto - Switch para Cesta */}
        <FormField
          control={form.control}
          name="isBasket"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  <ShoppingBasket className="w-4 h-4" />
                  Cesta / Combo
                </FormLabel>
                <FormDescription>
                  Produto composto por outros itens
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!!editProduct}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Product Type Selector - Only show for non-baskets */}
        {!isBasket && (
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tipo do Produto
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={!!editProduct}
                >
                  <FormControl>
                    <SelectTrigger className="input-styled min-h-[44px]">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="item">
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Item (Produto padrão)
                      </span>
                    </SelectItem>
                    <SelectItem value="packaging">
                      <span className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Embalagem (Sacola, Caixa, Cesta)
                      </span>
                    </SelectItem>
                    <SelectItem value="extra">
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Extra (Fita, Laço, Cartão)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {productType === "packaging" && "Embalagens serão usadas para montar cestas/combos."}
                  {productType === "extra" && "Extras são itens opcionais que podem ser adicionados às cestas."}
                  {productType === "item" && "Itens padrão que podem ser vendidos ou usados em cestas."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Nome do Produto */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isBasket ? "Nome da Cesta" : 
                 productType === "packaging" ? "Nome da Embalagem" :
                 productType === "extra" ? "Nome do Extra" : "Nome do Produto"}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={
                    isBasket ? "Ex: Kit Presente Natal" : 
                    productType === "packaging" ? "Ex: Sacola M, Caixa P" :
                    productType === "extra" ? "Ex: Fita, Laço, Papel" :
                    "Ex: Perfume Dolce & Gabbana"
                  }
                  className="input-styled min-h-[44px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basket Composition - Only show for baskets */}
        {isBasket && (
          <BasketCompositionForm
            availableProducts={availableProducts}
            items={basketItems}
            onItemsChange={setBasketItems}
            packagingProductId={basketPackagingProductId}
            onPackagingProductIdChange={setBasketPackagingProductId}
            packagingQty={basketPackagingQty}
            onPackagingQtyChange={setBasketPackagingQty}
            extras={basketExtras}
            onExtrasChange={setBasketExtras}
            desiredMargin={basketDesiredMargin}
            onDesiredMarginChange={setBasketDesiredMargin}
            isEditing={!!editProduct}
          />
        )}

        {/* Origem do Produto - Hide for baskets and packaging/extra */}
        {!isBasket && !isPackagingOrExtra && (
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem do Produto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-styled min-h-[44px]">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="purchased">Comprado</SelectItem>
                    <SelectItem value="gift">
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Brinde
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Categoria e Marca - stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-styled min-h-[44px]">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Presente">Presente</SelectItem>
                    <SelectItem value="Perfume">Perfume</SelectItem>
                    <SelectItem value="Cosmético">Cosmético</SelectItem>
                    <SelectItem value="Utensílios">Utensílios</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isPackagingOrExtra ? "Ex: Genérico" : "Ex: D&G"} 
                    className="input-styled min-h-[44px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ciclo e Preço de Custo - Only for non-baskets */}
        {!isBasket && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isPackagingOrExtra && (
              <FormField
                control={form.control}
                name="cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        inputMode="numeric"
                        placeholder="Ex: 1, 2, 3..." 
                        className="input-styled min-h-[44px]"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseInt(val, 10));
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Número do ciclo/campanha da revista.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem className={isPackagingOrExtra ? "col-span-1 sm:col-span-2" : ""}>
                  <FormLabel>Preço de Custo (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0,00" 
                      className="input-styled min-h-[44px]"
                      disabled={isGift && !isPackagingOrExtra}
                      {...field} 
                      value={(isGift && !isPackagingOrExtra) ? 0 : field.value}
                    />
                  </FormControl>
                  {isGift && !isPackagingOrExtra && (
                    <FormDescription className="text-xs">
                      Produtos recebidos como brinde têm custo zero.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Margem e Preço de Venda - for non-baskets */}
        {!isBasket && (
          <div className={cn("grid gap-4", (isGift && !isPackagingOrExtra) ? "grid-cols-1" : "grid-cols-2")}>
            {(!isGift || isPackagingOrExtra) && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Margem desejada (%)
                </label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    placeholder="Ex: 50" 
                    className="input-styled min-h-[44px] pr-8"
                    value={desiredMargin}
                    onChange={handleDesiredMarginChange}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Venda = Custo + Margem
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0,00" 
                      className="input-styled min-h-[44px]"
                      value={field.value || ""}
                      onChange={(e) => handleSalePriceChange(e, field.onChange)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  {isGift && !isPackagingOrExtra && (
                    <FormDescription className="text-xs">
                      Margem não se aplica para brinde (custo zero).
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Preço de Venda for baskets - editable override */}
        {isBasket && (
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Venda Final (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0,00" 
                    className="input-styled min-h-[44px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Calculado automaticamente pela margem, mas pode ser ajustado.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Cálculos automáticos - for non-baskets */}
        {!isBasket && costPrice > 0 && salePrice > 0 && salePrice > costPrice && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-3 sm:p-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Lucro/unidade</p>
                <p className="font-bold text-success text-base sm:text-lg">R$ {profit}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Margem real</p>
                <p className="font-bold text-success text-base sm:text-lg">{actualMargin}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Estoque e Validade */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isBasket ? "Cestas montadas" : 
                   productType === "packaging" ? "Estoque embalagens" :
                   productType === "extra" ? "Estoque extras" : "Estoque"}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    inputMode="numeric"
                    placeholder="0" 
                    className="input-styled min-h-[44px]"
                    {...field} 
                  />
                </FormControl>
                {isBasket && (
                  <FormDescription className="text-xs">
                    Quantidade de cestas prontas para venda.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Validade</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal input-styled min-h-[44px]",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yy", { locale: ptBR })
                        ) : (
                          <span>Opcional</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botões - sticky bottom on mobile */}
        <div className="flex gap-3 pt-4 sticky bottom-0 bg-card pb-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[48px] text-base"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="flex-1 btn-primary min-h-[48px] text-base"
            disabled={isBasket && basketItems.length === 0 && !editProduct}
          >
            {editProduct ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function ProductForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  editProduct,
  availableProducts = [],
  initialBasketItems = [],
  initialBasketExtras = [],
}: ProductFormProps) {
  const isMobile = useIsMobile();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      origin: "purchased",
      cycle: undefined,
      isBasket: false,
      packagingCost: 0,
      productType: "item",
      packagingProductId: undefined,
      packagingQty: 1,
    },
  });

  // Reset form when editProduct changes
  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name,
        category: editProduct.category,
        brand: editProduct.brand,
        costPrice: editProduct.costPrice,
        salePrice: editProduct.salePrice,
        stock: editProduct.stock,
        expiryDate: editProduct.expiryDate ? new Date(editProduct.expiryDate) : undefined,
        origin: editProduct.origin,
        cycle: editProduct.cycle,
        isBasket: editProduct.isBasket,
        packagingCost: editProduct.packagingCost,
        productType: editProduct.productType || "item",
        packagingProductId: editProduct.packagingProductId,
        packagingQty: editProduct.packagingQty || 1,
      });
    } else {
      form.reset({
        name: "",
        brand: "",
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        origin: "purchased",
        cycle: undefined,
        isBasket: false,
        packagingCost: 0,
        productType: "item",
        packagingProductId: undefined,
        packagingQty: 1,
      });
    }
  }, [editProduct, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = (data: ProductFormData, basketItems?: BasketItemInput[], basketExtras?: BasketExtraInput[]) => {
    onSubmit(data, basketItems, basketExtras);
    form.reset();
  };

  const header = (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
        {editProduct?.isBasket || form.watch("isBasket") ? (
          <ShoppingBasket className="w-5 h-5 text-primary-foreground" />
        ) : form.watch("productType") === "packaging" ? (
          <Box className="w-5 h-5 text-primary-foreground" />
        ) : form.watch("productType") === "extra" ? (
          <Gift className="w-5 h-5 text-primary-foreground" />
        ) : (
          <Package className="w-5 h-5 text-primary-foreground" />
        )}
      </div>
      <span className="text-xl font-semibold">
        {editProduct 
          ? (editProduct.isBasket ? "Editar Cesta" : 
             editProduct.productType === "packaging" ? "Editar Embalagem" :
             editProduct.productType === "extra" ? "Editar Extra" : "Editar Produto")
          : "Novo Produto"
        }
      </span>
    </div>
  );

  const description = editProduct 
    ? "Atualize os dados do produto."
    : "Preencha os dados do produto ou crie uma cesta personalizada.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{header}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <ProductFormContent 
              form={form} 
              onSubmit={handleSubmit} 
              onCancel={handleClose}
              editProduct={editProduct}
              availableProducts={availableProducts}
              initialBasketItems={initialBasketItems}
              initialBasketExtras={initialBasketExtras}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ProductFormContent 
          form={form} 
          onSubmit={handleSubmit} 
          onCancel={handleClose}
          editProduct={editProduct}
          availableProducts={availableProducts}
          initialBasketItems={initialBasketItems}
          initialBasketExtras={initialBasketExtras}
        />
      </DialogContent>
    </Dialog>
  );
}

export type { BasketItemInput, BasketExtraInput };
