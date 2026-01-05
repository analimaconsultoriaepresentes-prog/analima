import { Gift, AlertTriangle, MoreVertical, PackagePlus, Archive, Trash2, RotateCcw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ProductThumbnail } from "./ProductThumbnail";

interface ProductTableProps {
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

const productTypeLabels: Record<string, string> = {
  item: "Produto",
  packaging: "Embalagem",
  extra: "Extra",
  basket: "Cesta",
};

export function ProductTable({
  products,
  onEdit,
  onStockEntry,
  onArchive,
  onDelete,
  onReactivate,
}: ProductTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[180px] py-2 px-2 text-xs">Produto</TableHead>
            <TableHead className="w-[80px] py-2 px-2 text-xs">Marca</TableHead>
            <TableHead className="w-[90px] py-2 px-2 text-xs">Categoria</TableHead>
            <TableHead className="w-[75px] py-2 px-2 text-xs text-right">Custo</TableHead>
            <TableHead className="w-[75px] py-2 px-2 text-xs text-right">Pix</TableHead>
            <TableHead className="w-[75px] py-2 px-2 text-xs text-right">Cartão</TableHead>
            <TableHead className="w-[55px] py-2 px-2 text-xs text-center">Estoque</TableHead>
            <TableHead className="w-[50px] py-2 px-2 text-xs text-center">Ciclo</TableHead>
            <TableHead className="w-[70px] py-2 px-2 text-xs text-center">Status</TableHead>
            <TableHead className="w-[50px] py-2 px-2 text-xs text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {products.map((product) => (
            <TableRow
              key={product.id}
              className={cn(
                "transition-colors cursor-pointer hover:bg-muted/40",
                !product.isActive && "opacity-60 bg-muted/20"
              )}
              onDoubleClick={() => onEdit(product)}
            >
              <TableCell className="py-1.5 px-2">
                <div className="flex items-center gap-1.5">
                  <ProductThumbnail
                    imageUrl={product.imageUrl}
                    isBasket={product.isBasket}
                    size="sm"
                    className="w-8 h-8 rounded"
                  />
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                      {product.name}
                    </span>
                    {product.origin === "gift" && !product.isBasket && (
                      <span title="Brinde">
                        <Gift className="w-3 h-3 text-primary flex-shrink-0" />
                      </span>
                    )}
                    {!product.isBasket && product.stock < 3 && product.isActive && (
                      <span title="Estoque baixo">
                        <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-1.5 px-2 text-xs text-muted-foreground truncate">
                {product.brand || "—"}
              </TableCell>
              <TableCell className="py-1.5 px-2">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[product.category])}>
                  {product.category}
                </Badge>
              </TableCell>
              <TableCell className="py-1.5 px-2 text-right text-xs font-medium">
                R$ {product.costPrice.toFixed(2)}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-right text-xs font-medium text-success">
                {product.productType === "packaging" || product.productType === "extra" 
                  ? "—" 
                  : `R$ ${product.pricePix.toFixed(2)}`}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-right text-xs font-medium text-primary">
                {product.productType === "packaging" || product.productType === "extra"
                  ? "—"
                  : product.priceCard > 0 ? `R$ ${product.priceCard.toFixed(2)}` : "—"}
              </TableCell>
              <TableCell className={cn(
                "py-1.5 px-2 text-center text-xs font-medium",
                !product.isBasket && product.stock < 3 && product.isActive ? "text-warning" : ""
              )}>
                {product.stock}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-center text-xs text-muted-foreground">
                {product.cycle || "—"}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-center">
                {product.isActive ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                    Inativo
                  </Badge>
                )}
              </TableCell>
              <TableCell className="py-1.5 px-2" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-3.5 h-3.5" />
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
