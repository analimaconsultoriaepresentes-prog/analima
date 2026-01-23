import { useState, useMemo } from "react";
import { Search, Package, Plus, Gift, X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { isInternalProduct, getAvailableStock, type ProductType, type GiftType, GIFT_TYPE_LABELS } from "@/hooks/useProducts";

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

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  showPhotos?: boolean;
  paymentMethod?: string;
}

export function ProductGrid({ 
  products, 
  onSelectProduct, 
  showPhotos = true,
  paymentMethod = "pix"
}: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter out internal products
  const availableProducts = useMemo(() => 
    products.filter((p) => !isInternalProduct(p.productType || "item")),
    [products]
  );

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(availableProducts.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()];
  }, [availableProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = availableProducts;

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [availableProducts, selectedCategory, searchTerm]);

  const getPrice = (product: Product) => {
    if (paymentMethod === "credito" || paymentMethod === "debito") {
      return product.priceCard || product.salePrice;
    }
    return product.pricePix || product.salePrice;
  };

  const isGiftProduct = (product: Product) => {
    return product.giftType || product.isBasket || product.productType === "basket";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setSearchTerm("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat === "all" ? "Todos" : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              // Use available stock (total - prove) for sales
              const availableStock = Math.max(0, product.stock - (product.proveQty || 0));
              const outOfStock = availableStock <= 0;
              const lowStock = availableStock > 0 && availableStock <= 3;
              const isGift = isGiftProduct(product);
              const price = getPrice(product);

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => onSelectProduct(product)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border text-left transition-all group",
                    outOfStock
                      ? "bg-muted/30 border-border opacity-60 cursor-not-allowed"
                      : "bg-card border-border hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {/* Thumbnail */}
                  {showPhotos && (
                    <ProductThumbnail
                      imageUrl={product.imageUrl}
                      isBasket={!!isGift}
                      size="sm"
                      className="flex-shrink-0"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {product.name}
                      </p>
                      {isGift && <span className="text-amber-500">🎁</span>}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.category}
                      {product.brand && ` • ${product.brand}`}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          R$ {price.toFixed(2)}
                        </span>
                        {product.priceCard > 0 && product.priceCard !== product.pricePix && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <CreditCard className="w-3 h-3" />
                            R$ {product.priceCard.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {outOfStock ? (
                        <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                          Sem estoque
                        </span>
                      ) : lowStock ? (
                        <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">
                          {availableStock} un.
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {availableStock} un.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Icon */}
                  {!outOfStock && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
