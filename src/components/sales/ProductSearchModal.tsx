import { useState, useMemo } from "react";
import { Search, Gift, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { isInternalProduct, type ProductType, type GiftType, GIFT_TYPE_LABELS } from "@/hooks/useProducts";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";

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

interface ProductSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  showPhotos?: boolean;
}

export function ProductSearchModal({
  open,
  onOpenChange,
  products,
  onSelectProduct,
  showPhotos = true,
}: ProductSearchModalProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out internal products and apply search
  const filteredProducts = useMemo(() => {
    const nonInternalProducts = products.filter(
      (p) => !isInternalProduct(p.productType || "item")
    );

    if (!searchTerm.trim()) {
      return nonInternalProducts;
    }

    const term = searchTerm.toLowerCase();
    return nonInternalProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    setSearchTerm("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSearchTerm("");
    onOpenChange(false);
  };

  const getProductTypeLabel = (product: Product) => {
    // Check if it's a gift/basket product
    if (product.giftType) {
      return GIFT_TYPE_LABELS[product.giftType] || "Presente";
    }
    if (product.isBasket || product.productType === "basket") {
      return product.category === "Presente" ? "Presente" : "Cesta";
    }
    return "Produto";
  };

  const isGiftProduct = (product: Product) => {
    return (
      product.giftType ||
      product.isBasket ||
      product.productType === "basket"
    );
  };

  const content = (
    <div className="flex flex-col gap-4 h-full">
      {/* Search Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, marca ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 min-h-[48px] text-base"
          autoFocus
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setSearchTerm("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground px-1">
        {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 min-h-0 max-h-[50vh] sm:max-h-[60vh]">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tente buscar por outro termo
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock > 0 && product.stock <= 3;
              const typeLabel = getProductTypeLabel(product);
              const isGift = isGiftProduct(product);

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => handleSelectProduct(product)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    outOfStock
                      ? "bg-muted/30 border-border opacity-60 cursor-not-allowed"
                      : "bg-card border-border hover:border-primary/50 hover:shadow-md active:scale-[0.99]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Product Thumbnail + Info */}
                    <div className="flex gap-3 flex-1 min-w-0">
                      {showPhotos && (
                        <ProductThumbnail
                          imageUrl={product.imageUrl}
                          isBasket={!!isGift}
                          size={isMobile ? "sm" : "md"}
                          className="flex-shrink-0"
                        />
                      )}
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name and Type */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground truncate">
                            {product.name}
                          </p>
                          {isGift && (
                            <span className="text-amber-500">🎁</span>
                          )}
                        </div>

                      {/* Meta Info Row */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full font-medium",
                            isGift
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {typeLabel}
                        </span>
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">
                            {product.brand}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          • {product.category}
                        </span>
                        {product.cycle && (
                          <span className="text-xs text-muted-foreground">
                            • Ciclo {product.cycle}
                          </span>
                        )}
                      </div>

                      {/* Stock */}
                      <div className="mt-2">
                        {outOfStock ? (
                          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                            Sem estoque
                          </span>
                        ) : lowStock ? (
                          <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">
                            ⚠️ Apenas {product.stock} un.
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {product.stock} un. disponíveis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Prices */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            PIX
                          </span>
                          <span className="font-bold text-success text-lg">
                            R$ {product.pricePix.toFixed(2)}
                          </span>
                        </div>
                        {product.priceCard > 0 && product.priceCard !== product.pricePix && (
                          <div>
                            <span className="text-[10px] text-muted-foreground block">
                              Cartão
                            </span>
                            <span className="text-sm text-foreground">
                              R$ {product.priceCard.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={handleClose}
        >
          Fechar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Buscar Produto
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-hidden flex flex-col">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Buscar Produto
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 overflow-hidden flex flex-col flex-1">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
