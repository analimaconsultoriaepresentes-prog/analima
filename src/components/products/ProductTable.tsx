import { Package, Gift, ShoppingBasket, AlertTriangle, Pencil, MoreVertical, PackagePlus, Archive, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Product, GIFT_TYPE_LABELS } from "@/hooks/useProducts";

interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  onToggleSelect: (productId: string) => void;
  onSelectAll: (checked: boolean) => void;
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

const productTypeLabels: Record<string, string> = {
  item: "Produto",
  packaging: "Embalagem",
  extra: "Extra",
  basket: "Cesta",
};

export function ProductTable({
  products,
  selectedProducts,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onStockEntry,
  onArchive,
  onDelete,
  onReactivate,
}: ProductTableProps) {
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead className="min-w-[200px]">Produto</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Pix</TableHead>
            <TableHead className="text-right">Cartão</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="text-center">Ciclo</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-24 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className={cn(
                "transition-colors",
                !product.isActive && "opacity-60 bg-muted/20"
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => onToggleSelect(product.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                    product.isBasket ? "bg-primary/10" : "bg-muted"
                  )}>
                    {product.isBasket ? (
                      <ShoppingBasket className="w-4 h-4 text-primary" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {product.name}
                    </span>
                    {product.origin === "gift" && !product.isBasket && (
                      <span title="Brinde">
                        <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                      </span>
                    )}
                    {product.isBasket && (
                      <span title={product.giftType ? GIFT_TYPE_LABELS[product.giftType] : "Cesta"}>
                        <ShoppingBasket className="w-4 h-4 text-primary flex-shrink-0" />
                      </span>
                    )}
                    {!product.isBasket && product.stock < 3 && product.isActive && (
                      <span title="Estoque baixo">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.brand || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-xs", categoryColors[product.category])}>
                  {product.category}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {product.costPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium text-success">
                {product.productType === "packaging" || product.productType === "extra" 
                  ? "—" 
                  : `R$ ${product.pricePix.toFixed(2)}`}
              </TableCell>
              <TableCell className="text-right font-medium text-primary">
                {product.productType === "packaging" || product.productType === "extra"
                  ? "—"
                  : product.priceCard > 0 ? `R$ ${product.priceCard.toFixed(2)}` : "—"}
              </TableCell>
              <TableCell className={cn(
                "text-right font-medium",
                !product.isBasket && product.stock < 3 && product.isActive ? "text-warning" : ""
              )}>
                {product.stock}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {product.cycle || "—"}
              </TableCell>
              <TableCell className="text-center">
                {product.isActive ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                    Inativo
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  {product.isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(product)}
                      title="Editar"
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
                            Excluir definitivamente
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
