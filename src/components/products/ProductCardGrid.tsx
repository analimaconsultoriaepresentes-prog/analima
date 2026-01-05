import { Package, Gift, ShoppingBasket, AlertTriangle, Pencil, MoreVertical, PackagePlus, Archive, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Product, GIFT_TYPE_LABELS } from "@/hooks/useProducts";

interface ProductCardGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onStockEntry: (product: Product) => void;
  onArchive: (product: Product) => void;
  onDelete: (product: Product) => void;
  onReactivate: (product: Product) => void;
}

const categoryColors: Record<string, string> = {
  Perfume: "bg-primary/10 text-primary border-primary/20",
  Presente: "bg-accent/10 text-accent border-accent/20",
  Cosmético: "bg-success/10 text-success border-success/20",
  Utensílios: "bg-muted text-muted-foreground border-border",
};

export function ProductCardGrid({
  products,
  onEdit,
  onStockEntry,
  onArchive,
  onDelete,
  onReactivate,
}: ProductCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product, index) => (
        <Card
          key={product.id}
          className={cn(
            "group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer animate-scale-in",
            !product.isActive && "opacity-60"
          )}
          style={{ animationDelay: `${index * 30}ms` }}
          onDoubleClick={() => product.isActive && onEdit(product)}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  product.isBasket ? "bg-primary/10" : "bg-muted"
                )}>
                  {product.isBasket ? (
                    <ShoppingBasket className="w-5 h-5 text-primary" />
                  ) : (
                    <Package className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground truncate">
                      {product.name}
                    </span>
                    {product.origin === "gift" && !product.isBasket && (
                      <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {product.brand || "Sem marca"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!product.isBasket && product.isActive && (
                    <DropdownMenuItem onClick={() => onStockEntry(product)}>
                      <PackagePlus className="w-4 h-4 mr-2" />
                      Entrada de estoque
                    </DropdownMenuItem>
                  )}
                  {product.isActive && (
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {product.isActive ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => onArchive(product)}
                        className="text-warning focus:text-warning"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Arquivar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(product)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onReactivate(product)}
                      className="text-success focus:text-success"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reativar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <Badge variant="outline" className={cn("text-xs", categoryColors[product.category])}>
                {product.category}
              </Badge>
              {!product.isActive && (
                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                  Inativo
                </Badge>
              )}
              {product.cycle && (
                <Badge variant="outline" className="text-xs">
                  Ciclo {product.cycle}
                </Badge>
              )}
              {product.origin === "gift" && product.giftType && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                  {GIFT_TYPE_LABELS[product.giftType] || product.giftType}
                </Badge>
              )}
            </div>

            {/* Stock Warning */}
            {!product.isBasket && product.stock < 3 && product.isActive && (
              <div className="flex items-center gap-1.5 text-warning text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Estoque baixo</span>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Custo</p>
                <p className="font-medium text-foreground">R$ {product.costPrice.toFixed(2)}</p>
              </div>
              {product.productType !== "packaging" && product.productType !== "extra" ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Pix</p>
                    <p className="font-medium text-success">R$ {product.pricePix.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cartão</p>
                    <p className="font-medium text-primary">
                      {product.priceCard > 0 ? `R$ ${product.priceCard.toFixed(2)}` : "—"}
                    </p>
                  </div>
                </>
              ) : null}
              <div>
                <p className="text-xs text-muted-foreground">Estoque</p>
                <p className={cn(
                  "font-medium",
                  !product.isBasket && product.stock < 3 && product.isActive ? "text-warning" : "text-foreground"
                )}>
                  {product.stock} un.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
