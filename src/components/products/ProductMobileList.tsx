import { Gift, ShoppingBasket, AlertTriangle, Pencil, MoreVertical, PackagePlus, Archive, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Product, GIFT_TYPE_LABELS } from "@/hooks/useProducts";
import { ProductThumbnail } from "./ProductThumbnail";

interface ProductMobileListProps {
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

export function ProductMobileList({
  products,
  onEdit,
  onStockEntry,
  onArchive,
  onDelete,
  onReactivate,
}: ProductMobileListProps) {
  return (
    <div className="space-y-2">
      {products.map((product, index) => (
        <div
          key={product.id}
          className={cn(
            "bg-card rounded-lg border border-border/50 p-4 animate-slide-up",
            !product.isActive && "opacity-60"
          )}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ProductThumbnail
                imageUrl={product.imageUrl}
                isBasket={product.isBasket}
                size="md"
                className="w-11 h-11 rounded-md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground truncate">
                    {product.name}
                  </span>
                  {product.origin === "gift" && !product.isBasket && (
                    <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  {product.isBasket && (
                    <ShoppingBasket className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  {!product.isBasket && product.stock < 3 && product.isActive && (
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {product.brand || "Sem marca"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {product.isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
          </div>

          {/* Badges Row */}
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
          </div>

          {/* Info Row */}
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Custo</p>
              <p className="font-medium">R$ {product.costPrice.toFixed(2)}</p>
            </div>
            {product.productType !== "packaging" && product.productType !== "extra" && (
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
            )}
            <div>
              <p className="text-xs text-muted-foreground">Estoque</p>
              <p className={cn(
                "font-medium",
                !product.isBasket && product.stock < 3 && product.isActive ? "text-warning" : ""
              )}>
                {product.stock} un.
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
