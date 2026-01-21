import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
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

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartItemsProps {
  items: CartItem[];
  paymentMethod: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  showPhotos?: boolean;
}

export function CartItems({
  items,
  paymentMethod,
  onUpdateQuantity,
  onRemoveItem,
  showPhotos = true,
}: CartItemsProps) {
  const getPrice = (product: Product) => {
    if (paymentMethod === "credito" || paymentMethod === "debito") {
      return product.priceCard || product.salePrice;
    }
    return product.pricePix || product.salePrice;
  };

  const isGiftProduct = (product: Product) => {
    return product.giftType || product.isBasket || product.productType === "basket";
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-medium">Carrinho vazio</p>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Selecione produtos à esquerda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const price = getPrice(item.product);
        const isGift = isGiftProduct(item.product);
        const subtotal = price * item.quantity;

        return (
          <div
            key={item.product.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 group hover:border-border transition-colors"
          >
            {/* Thumbnail */}
            {showPhotos && (
              <ProductThumbnail
                imageUrl={item.product.imageUrl}
                isBasket={!!isGift}
                size="sm"
                className="flex-shrink-0"
              />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                R$ {price.toFixed(2)} cada
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1 bg-background rounded-lg border border-border">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.product.id, -1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold text-sm">
                {item.quantity}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.product.id, 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Subtotal */}
            <div className="w-20 text-right">
              <p className="font-bold text-sm text-foreground">
                R$ {subtotal.toFixed(2)}
              </p>
            </div>

            {/* Remove Button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemoveItem(item.product.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
