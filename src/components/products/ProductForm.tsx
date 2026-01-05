import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package, Percent, Gift, ShoppingBasket, Box, Tag, Info, AlertTriangle, RefreshCw, ImagePlus } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { BasketCompositionForm, calculateItemsPrice, calculateBaseGiftPrice, type BasketItemInput, type BasketExtraInput } from "./BasketCompositionForm";
import { ProductImageUpload } from "./ProductImageUpload";
import type { Product, ProductFormData, ProductType, GiftType } from "@/hooks/useProducts";
import { GIFT_TYPE_LABELS } from "@/hooks/useProducts";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  category: z.enum(["Presente", "Perfume", "Cosmético", "Utensílios"], {
    required_error: "Selecione uma categoria",
  }),
  brand: z.string().min(1, "Informe a marca").max(50, "Marca muito longa"),
  costPrice: z.coerce.number().min(0, "Preço de custo não pode ser negativo"),
  salePrice: z.coerce.number().min(0, "Preço de venda deve ser maior que zero"),
  pricePix: z.coerce.number().min(0, "Preço Pix não pode ser negativo"),
  priceCard: z.coerce.number().min(0, "Preço Cartão não pode ser negativo"),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  expiryDate: z.date().optional(),
  origin: z.enum(["purchased", "gift"]),
  cycle: z.coerce.number().int().min(1, "Ciclo deve ser maior que zero").optional().or(z.literal("")),
  isBasket: z.boolean(),
  packagingCost: z.coerce.number().min(0, "Custo de embalagem não pode ser negativo"),
  productType: z.enum(["item", "packaging", "extra", "basket"]),
  packagingProductId: z.string().optional(),
  packagingQty: z.coerce.number().int().min(1, "Quantidade deve ser maior que zero"),
  giftType: z.enum(["presente", "cesta", "kit", "mini_presente", "lembrancinha"]).optional(),
  packagingDiscount: z.coerce.number().min(0, "Desconto não pode ser negativo"),
  imageUrl: z.string().optional(),
}).refine((data) => {
  // Packaging/extra products don't need sale prices - they are internal cost only
  if (data.productType === "packaging" || data.productType === "extra") {
    return true;
  }
  // For baskets, prices just need to be > 0 (no cost validation - allow negative profit)
  if (data.isBasket) {
    return data.pricePix > 0 && data.priceCard > 0;
  }
  // For gifts (cost = 0), only require prices > 0
  if (data.origin === "gift") {
    return data.pricePix > 0 && data.priceCard > 0;
  }
  // For purchased products, require prices > cost price
  return data.pricePix > data.costPrice && data.priceCard > data.costPrice;
}, {
  message: "Preços de venda devem ser maiores que zero",
  path: ["pricePix"],
});

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData, basketItems?: BasketItemInput[], basketExtras?: BasketExtraInput[]) => void;
  editProduct?: Product | null;
  availableProducts?: Product[];
  initialBasketItems?: BasketItemInput[];
  initialBasketExtras?: BasketExtraInput[];
  defaultAsGift?: boolean;
}

// Discount mode removed - now only packaging discount in R$

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
  // For non-basket products: margin-based calculation
  const [desiredMargin, setDesiredMargin] = useState<string>("");
  
  // For basket products: packaging/extras discount only
  const [packagingDiscountValue, setPackagingDiscountValue] = useState<string>("");
  const [isPixManuallyOverridden, setIsPixManuallyOverridden] = useState(false);
  
  const [basketItems, setBasketItems] = useState<BasketItemInput[]>([]);
  const [basketExtras, setBasketExtras] = useState<BasketExtraInput[]>([]);
  const [basketPackagingProductId, setBasketPackagingProductId] = useState<string | undefined>();
  const [basketPackagingQty, setBasketPackagingQty] = useState<number>(1);
  
  // Image URL state
  const [imageUrl, setImageUrl] = useState<string | null>(editProduct?.imageUrl || null);
  
  // Track if the change is from margin input to avoid loops (for non-basket)
  const isMarginDriven = useRef(false);
  const isPixDriven = useRef(false);
  
  const costPrice = form.watch("costPrice");
  const pricePix = form.watch("pricePix");
  const priceCard = form.watch("priceCard");
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

  // Initialize packaging and discount when editing a basket
  useEffect(() => {
    if (editProduct?.isBasket) {
      setBasketPackagingProductId(editProduct.packagingProductId);
      setBasketPackagingQty(editProduct.packagingQty || 1);
      // Load saved packaging discount
      setPackagingDiscountValue(editProduct.packagingDiscount > 0 ? editProduct.packagingDiscount.toString() : "");
      // Mark as manually overridden since we're loading existing prices
      setIsPixManuallyOverridden(true);
    } else {
      setBasketPackagingProductId(undefined);
      setBasketPackagingQty(1);
      setPackagingDiscountValue("");
    }
  }, [editProduct]);

  // Initialize imageUrl when editing
  useEffect(() => {
    setImageUrl(editProduct?.imageUrl || null);
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

  // Calculate items price (sum of Pix prices of items)
  const itemsPrice = useMemo(() => {
    return calculateItemsPrice(basketItems);
  }, [basketItems]);

  // Calculate "Preço Base do Presente" = items price + packaging cost + extras cost
  const baseGiftPrice = useMemo(() => {
    return calculateBaseGiftPrice(basketItems, basketCosts.packagingCost, basketCosts.totalExtrasCost);
  }, [basketItems, basketCosts.packagingCost, basketCosts.totalExtrasCost]);

  // Calculate packaging/extras discount amount (always in R$)
  const packagingDiscountAmount = useMemo(() => {
    const val = parseFloat(packagingDiscountValue) || 0;
    const maxDiscount = basketCosts.packagingCost + basketCosts.totalExtrasCost;
    // Limit to max allowed
    return Math.min(val, maxDiscount);
  }, [packagingDiscountValue, basketCosts.packagingCost, basketCosts.totalExtrasCost]);

  // Total discount (now only packaging discount)
  const totalDiscountAmount = packagingDiscountAmount;

  // Calculate suggested Pix price (base - discounts, but never less than total cost)
  const suggestedPixPrice = useMemo(() => {
    const rawPrice = baseGiftPrice - totalDiscountAmount;
    // Ensure Pix is never less than total cost
    return Math.max(basketCosts.totalCost, rawPrice);
  }, [baseGiftPrice, totalDiscountAmount, basketCosts.totalCost]);

  // Update form values when basket composition changes (costs and packaging discount)
  useEffect(() => {
    if (isBasket) {
      form.setValue("costPrice", basketCosts.totalCost, { shouldValidate: true });
      form.setValue("packagingCost", basketCosts.packagingCost, { shouldValidate: true });
      form.setValue("packagingProductId", basketPackagingProductId, { shouldValidate: true });
      form.setValue("packagingQty", basketPackagingQty, { shouldValidate: true });
      form.setValue("packagingDiscount", packagingDiscountAmount, { shouldValidate: true });
    }
  }, [isBasket, basketCosts, basketPackagingProductId, basketPackagingQty, packagingDiscountAmount, form]);

  // Auto-update Pix price when discount changes (only if not manually overridden)
  useEffect(() => {
    if (isBasket && !isPixManuallyOverridden && baseGiftPrice > 0) {
      form.setValue("pricePix", suggestedPixPrice, { shouldValidate: true });
      form.setValue("salePrice", suggestedPixPrice, { shouldValidate: true });
    }
  }, [isBasket, suggestedPixPrice, isPixManuallyOverridden, baseGiftPrice, form]);

  // Reset basket items when switching to non-basket (only for new products)
  useEffect(() => {
    if (!isBasket && !editProduct) {
      setBasketItems([]);
      setBasketExtras([]);
      setBasketPackagingProductId(undefined);
      setBasketPackagingQty(1);
      setPackagingDiscountValue("");
      setIsPixManuallyOverridden(false);
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
  
  // Calculate profit for display (non-basket)
  const profitPix = pricePix > costPrice ? (pricePix - costPrice).toFixed(2) : "0.00";
  const profitCard = priceCard > costPrice ? (priceCard - costPrice).toFixed(2) : "0.00";

  // Calculate basket profit (can be negative)
  const basketProfitPix = pricePix - basketCosts.totalCost;
  const basketMarginPix = basketCosts.totalCost > 0 ? (basketProfitPix / basketCosts.totalCost) * 100 : 0;
  const isNegativeProfit = basketProfitPix < 0;

  // Calculate % when margin is typed (for Pix only - non-basket products)
  useEffect(() => {
    if (isMarginDriven.current && !isBasket) {
      isMarginDriven.current = false;
      
      const marginValue = parseFloat(desiredMargin);
      
      if (!isNaN(marginValue) && marginValue >= 0 && costPrice > 0) {
        const calculatedPix = costPrice * (1 + marginValue / 100);
        const roundedPix = Math.round(calculatedPix * 100) / 100;
        form.setValue("pricePix", roundedPix, { shouldValidate: true });
        form.setValue("salePrice", roundedPix, { shouldValidate: true });
      }
    }
  }, [desiredMargin, costPrice, isBasket, form]);

  // Initialize desired margin when editing a non-basket product
  useEffect(() => {
    if (editProduct && !editProduct.isBasket) {
      const effectiveCost = editProduct.costPrice;
      const pix = editProduct.pricePix || editProduct.salePrice;
      if (effectiveCost > 0 && pix > effectiveCost) {
        const calculatedMargin = ((pix - effectiveCost) / effectiveCost * 100).toFixed(1);
        setDesiredMargin(calculatedMargin);
      }
    }
  }, [editProduct]);

  // Handle Pix price change - for non-basket products
  const handlePixPriceChange = (value: number) => {
    isPixDriven.current = true;
    form.setValue("pricePix", value, { shouldValidate: true });
    form.setValue("salePrice", value, { shouldValidate: true });
    
    if (costPrice > 0 && value > 0) {
      const newMargin = ((value - costPrice) / costPrice * 100).toFixed(1);
      setDesiredMargin(newMargin);
    } else if (costPrice === 0) {
      setDesiredMargin("—");
    }
  };

  // Handle manual Pix price change for baskets
  const handleBasketPixPriceChange = (value: number) => {
    setIsPixManuallyOverridden(true);
    form.setValue("pricePix", value, { shouldValidate: true });
    form.setValue("salePrice", value, { shouldValidate: true });
  };

  // Recalculate Pix from discount
  const handleRecalculatePix = () => {
    setIsPixManuallyOverridden(false);
    form.setValue("pricePix", suggestedPixPrice, { shouldValidate: true });
    form.setValue("salePrice", suggestedPixPrice, { shouldValidate: true });
  };

  // Handle margin change - for non-basket products
  const handleDesiredMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    isMarginDriven.current = true;
    setDesiredMargin(value);
  };

  function handleSubmit(data: ProductFormData) {
    // Include imageUrl in the data
    const dataWithImage = { ...data, imageUrl: imageUrl || undefined };
    onSubmit(dataWithImage, isBasket ? basketItems : undefined, isBasket ? basketExtras : undefined);
    form.reset();
    setImageUrl(null);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-5">
        {/* Aviso de edição de preços */}
        {editProduct && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Alterações de preço valem apenas para novas vendas.</span>
          </div>
        )}

        {/* Foto do Produto */}
        <ProductImageUpload
          imageUrl={imageUrl}
          onImageChange={setImageUrl}
          productId={editProduct?.id}
        />
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

        {/* Tipo de Presente - Only show for baskets */}
        {isBasket && (
          <FormField
            control={form.control}
            name="giftType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Tipo de Presente
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="input-styled min-h-[44px]">
                      <SelectValue placeholder="Selecione o tipo de presente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.entries(GIFT_TYPE_LABELS) as [GiftType, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Define como o produto aparece na listagem e vendas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        {/* Preços de Venda por Forma de Pagamento - for non-baskets, non-packaging/extra */}
        {!isBasket && !isPackagingOrExtra && (
          <>
            {/* Margem desejada (%) - for Pix only */}
            {!isGift && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  % de ganho (Pix)
                </label>
                <div className="relative">
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="Ex: 50" 
                    className="input-styled min-h-[44px] pr-8"
                    value={desiredMargin}
                    onChange={handleDesiredMarginChange}
                    disabled={costPrice === 0}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Calcula o Preço Pix automaticamente. Cartão é sempre manual.
                </p>
              </div>
            )}

            {/* Preços por forma de pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricePix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      💵 Pix / Dinheiro (R$)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0,00" 
                        className="input-styled min-h-[44px]"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          handlePixPriceChange(value);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Digitar ou usar % de ganho acima
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      💳 Cartão (R$)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0,00" 
                        className="input-styled min-h-[44px]"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isGift && (
              <p className="text-xs text-muted-foreground">
                Brindes têm custo zero. Defina os preços de venda livremente.
              </p>
            )}
          </>
        )}

        {/* Aviso para packaging/extra */}
        {isPackagingOrExtra && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {productType === "packaging" ? "Embalagens" : "Extras"} não têm preço de venda. 
              São usados apenas para cálculo de custo em cestas e combos.
            </span>
          </div>
        )}

        {isBasket && (
          <>

            {/* Packaging/Extras Discount Section */}
            <div className="space-y-3 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Box className="w-4 h-4" />
                Desconto Embalagem/Extras (R$)
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Desconto sobre o custo de embalagem e extras (não cobrar do cliente)
              </p>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max={basketCosts.packagingCost + basketCosts.totalExtrasCost}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="input-styled min-h-[44px] pr-10"
                  value={packagingDiscountValue}
                  onChange={(e) => {
                    setPackagingDiscountValue(e.target.value);
                    setIsPixManuallyOverridden(false);
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo: R$ {(basketCosts.packagingCost + basketCosts.totalExtrasCost).toFixed(2)} (emb: R$ {basketCosts.packagingCost.toFixed(2)} + extras: R$ {basketCosts.totalExtrasCost.toFixed(2)})
              </p>
            </div>

            {/* Total Discount Summary */}
            {totalDiscountAmount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <span className="text-sm font-medium">Total de Descontos</span>
                <span className="text-sm font-bold text-orange-600">- R$ {totalDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Pix Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricePix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      💵 Pix / Dinheiro (R$)
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          placeholder="0,00" 
                          className={cn(
                            "input-styled min-h-[44px]",
                            isPixManuallyOverridden && "border-primary/50"
                          )}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            handleBasketPixPriceChange(value);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      {isPixManuallyOverridden && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-[44px] w-[44px] flex-shrink-0"
                          onClick={handleRecalculatePix}
                          title="Recalcular do desconto"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <FormDescription className="text-xs">
                      {isPixManuallyOverridden 
                        ? "Valor editado manualmente" 
                        : "Calculado: Base - Desconto"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      💳 Cartão (R$)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0,00" 
                        className="input-styled min-h-[44px]"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Sempre manual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Cálculos automáticos - for non-baskets */}
        {!isBasket && !isPackagingOrExtra && costPrice > 0 && pricePix > 0 && pricePix > costPrice && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-3 sm:p-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Lucro Pix/unidade</p>
                <p className="font-bold text-success text-base sm:text-lg">R$ {profitPix}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Lucro Cartão/unidade</p>
                <p className="font-bold text-success text-base sm:text-lg">R$ {profitCard}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resumo completo for baskets */}
        {isBasket && basketItems.length > 0 && (
          <div className={cn(
            "rounded-lg p-3 sm:p-4 animate-fade-in border",
            isNegativeProfit 
              ? "bg-destructive/5 border-destructive/20" 
              : "bg-success/5 border-success/20"
          )}>
            <div className="space-y-3">
              {/* Row 1: Product values */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Valor dos Produtos (Pix)</p>
                  <p className="font-medium text-blue-600">R$ {itemsPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Embalagem + Extras</p>
                  <p className="font-medium">R$ {(basketCosts.packagingCost + basketCosts.totalExtrasCost).toFixed(2)}</p>
                </div>
              </div>

              {/* Row 2: Base price and discounts */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/50 pt-3">
                <div>
                  <p className="text-muted-foreground text-xs">Preço Base do Presente</p>
                  <p className="font-bold text-primary">R$ {baseGiftPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Descontos</p>
                  <p className="font-medium text-orange-600">- R$ {totalDiscountAmount.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Row 3: Final Pix and Cost */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/50 pt-3">
                <div>
                  <p className="text-muted-foreground text-xs">Preço Pix Final</p>
                  <p className="font-bold text-lg text-primary">R$ {pricePix.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Custo Total (interno)</p>
                  <p className="font-medium">R$ {basketCosts.totalCost.toFixed(2)}</p>
                </div>
              </div>

              {/* Row 3: Profit and Margin */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/50 pt-3">
                <div>
                  <p className="text-muted-foreground text-xs">Lucro (Pix)</p>
                  <p className={cn(
                    "font-bold",
                    isNegativeProfit ? "text-destructive" : "text-success"
                  )}>
                    R$ {basketProfitPix.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Margem</p>
                  <p className={cn(
                    "font-bold",
                    isNegativeProfit ? "text-destructive" : "text-success"
                  )}>
                    {basketMarginPix.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Warning for negative profit */}
              {isNegativeProfit && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md mt-2">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">
                    Atenção: preço Pix abaixo do custo total. Lucro negativo.
                  </p>
                </div>
              )}
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
  defaultAsGift = false,
}: ProductFormProps) {
  const isMobile = useIsMobile();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      costPrice: 0,
      salePrice: 0,
      pricePix: 0,
      priceCard: 0,
      stock: 0,
      origin: "purchased",
      cycle: undefined,
      isBasket: false,
      packagingCost: 0,
      productType: "item",
      packagingProductId: undefined,
      packagingQty: 1,
      packagingDiscount: 0,
    },
  });

  // Reset form when editProduct changes or when opening as gift
  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name,
        category: editProduct.category,
        brand: editProduct.brand,
        costPrice: editProduct.costPrice,
        salePrice: editProduct.salePrice,
        pricePix: editProduct.pricePix || editProduct.salePrice,
        priceCard: editProduct.priceCard || editProduct.salePrice,
        stock: editProduct.stock,
        expiryDate: editProduct.expiryDate ? new Date(editProduct.expiryDate) : undefined,
        origin: editProduct.origin,
        cycle: editProduct.cycle,
        isBasket: editProduct.isBasket,
        packagingCost: editProduct.packagingCost,
        productType: editProduct.productType || "item",
        packagingProductId: editProduct.packagingProductId,
        packagingQty: editProduct.packagingQty || 1,
        giftType: editProduct.giftType,
        packagingDiscount: editProduct.packagingDiscount || 0,
      });
    } else if (defaultAsGift && open) {
      // Open as gift/basket from Getting Started
      form.reset({
        name: "",
        brand: "",
        category: "Presente",
        costPrice: 0,
        salePrice: 0,
        pricePix: 0,
        priceCard: 0,
        stock: 0,
        origin: "purchased",
        cycle: undefined,
        isBasket: true,
        packagingCost: 0,
        productType: "basket",
        packagingProductId: undefined,
        packagingQty: 1,
        giftType: "presente",
        packagingDiscount: 0,
      });
    } else {
      form.reset({
        name: "",
        brand: "",
        costPrice: 0,
        salePrice: 0,
        pricePix: 0,
        priceCard: 0,
        stock: 0,
        origin: "purchased",
        cycle: undefined,
        isBasket: false,
        packagingCost: 0,
        productType: "item",
        packagingProductId: undefined,
        packagingQty: 1,
        giftType: undefined,
        packagingDiscount: 0,
      });
    }
  }, [editProduct, form, defaultAsGift, open]);

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
