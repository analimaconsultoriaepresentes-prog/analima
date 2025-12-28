import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Filter, Package, AlertTriangle, Pencil, Trash2, MoreVertical, Loader2, Gift, PackagePlus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProductForm, type BasketItemInput } from "@/components/products/ProductForm";
import { StockEntryModal } from "@/components/products/StockEntryModal";
import { ProductFilters, type ProductFiltersState } from "@/components/products/ProductFilters";
import { useProducts, type Product, type ProductFormData } from "@/hooks/useProducts";
import { useBaskets } from "@/hooks/useBaskets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryColors: Record<string, string> = {
  Perfume: "bg-primary/10 text-primary",
  Presente: "bg-accent/10 text-accent",
  Cosmético: "bg-success/10 text-success",
  Utensílios: "bg-muted text-muted-foreground",
};

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] = useState<Product | null>(null);
  const [stockEntryProduct, setStockEntryProduct] = useState<Product | null>(null);
  const [editBasketItems, setEditBasketItems] = useState<BasketItemInput[]>([]);
  const [filters, setFilters] = useState<ProductFiltersState>({
    categories: [],
    origins: [],
    stockFilter: "all",
    cycle: "",
  });

  const { products, loading, addProduct, updateProduct, deleteProduct, restoreStock, refetch } = useProducts();
  const { saveBasketItems, fetchBasketItems } = useBaskets();

  // Filter out baskets for the available products in basket composition
  const availableProductsForBasket = useMemo(() => {
    return products.filter((p) => !p.isBasket);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Text search
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }

      // Origin filter
      if (filters.origins.length > 0 && !filters.origins.includes(product.origin)) {
        return false;
      }

      // Stock filter
      if (filters.stockFilter === "inStock" && product.stock <= 0) return false;
      if (filters.stockFilter === "lowStock" && (product.stock > 5 || product.stock <= 0)) return false;
      if (filters.stockFilter === "outOfStock" && product.stock > 0) return false;

      // Cycle filter
      if (filters.cycle !== "") {
        const cycleNum = parseInt(filters.cycle, 10);
        if (!isNaN(cycleNum) && product.cycle !== cycleNum) return false;
      }

      return true;
    });
  }, [products, searchTerm, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.origins.length > 0) count++;
    if (filters.stockFilter !== "all") count++;
    if (filters.cycle !== "") count++;
    return count;
  }, [filters]);

  const calculateMargin = (cost: number, sale: number) => {
    if (cost <= 0) return "100.0";
    return ((sale - cost) / sale * 100).toFixed(1);
  };

  const handleAddProduct = async (data: ProductFormData, basketItems?: BasketItemInput[]) => {
    const productId = await addProduct(data);
    if (productId) {
      // If it's a basket, save the basket items using the returned product ID
      if (data.isBasket && basketItems && basketItems.length > 0) {
        await saveBasketItems(
          productId,
          basketItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        );
      }
      setIsFormOpen(false);
    }
  };

  const handleEditProduct = async (data: ProductFormData, basketItems?: BasketItemInput[]) => {
    if (!editProduct) return;
    const success = await updateProduct(editProduct.id, data);
    if (success) {
      // Update basket items if it's a basket
      if (data.isBasket && basketItems) {
        await saveBasketItems(
          editProduct.id,
          basketItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        );
      }
      setEditProduct(null);
      setEditBasketItems([]);
      setIsFormOpen(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductState) return;
    await deleteProduct(deleteProductState.id, deleteProductState.name);
    setDeleteProductState(null);
  };

  const openEditModal = async (product: Product) => {
    setEditProduct(product);
    
    // Load basket items if it's a basket
    if (product.isBasket) {
      const items = await fetchBasketItems(product.id);
      setEditBasketItems(
        items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          salePrice: item.salePrice,
        }))
      );
    } else {
      setEditBasketItems([]);
    }
    
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditProduct(null);
      setEditBasketItems([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu estoque e catálogo</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-styled"
          />
        </div>
        <Button 
          variant="outline" 
          className="gap-2 relative"
          onClick={() => setIsFiltersOpen(true)}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto cadastrado</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro produto ao catálogo.</p>
          <Button className="btn-primary gap-2" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-card rounded-xl border border-border/50 p-5 shadow-sm card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    product.isBasket ? "bg-primary/10" : "bg-muted"
                  )}>
                    {product.isBasket ? (
                      <ShoppingBasket className="w-6 h-6 text-primary" />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1 flex items-center gap-1.5">
                      {product.name}
                      {product.origin === "gift" && !product.isBasket && (
                        <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!product.isBasket && (
                      <DropdownMenuItem onClick={() => setStockEntryProduct(product)}>
                        <PackagePlus className="w-4 h-4 mr-2" />
                        Entrada de estoque
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openEditModal(product)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteProductState(product)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {product.isBasket && (
                  <span className="alert-badge bg-primary/10 text-primary flex items-center gap-1">
                    <ShoppingBasket className="w-3 h-3" />
                    Cesta
                  </span>
                )}
                <span className={cn("alert-badge", categoryColors[product.category])}>
                  {product.category}
                </span>
                {product.origin === "gift" && !product.isBasket && (
                  <span className="alert-badge bg-primary/10 text-primary flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    Brinde
                  </span>
                )}
                {!product.isBasket && product.stock < 3 && (
                  <span className="alert-badge alert-badge-warning flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Estoque baixo
                  </span>
                )}
                {product.cycle && (
                  <span className="alert-badge bg-muted text-muted-foreground">
                    Ciclo {product.cycle}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Custo</p>
                  <p className="font-semibold text-foreground">R$ {product.costPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Venda</p>
                  <p className="font-semibold text-success">R$ {product.salePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{product.isBasket ? "Montadas" : "Estoque"}</p>
                  <p className={cn("font-semibold", !product.isBasket && product.stock < 3 ? "text-warning" : "text-foreground")}>
                    {product.stock} un.
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Margem</p>
                  <p className="font-semibold text-primary">{calculateMargin(product.costPrice, product.salePrice)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editProduct ? handleEditProduct : handleAddProduct}
        editProduct={editProduct}
        availableProducts={availableProductsForBasket}
        initialBasketItems={editBasketItems}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductState} onOpenChange={(open) => !open && setDeleteProductState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteProductState?.isBasket ? "cesta" : "produto"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteProductState?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Entry Modal */}
      <StockEntryModal
        open={!!stockEntryProduct}
        onOpenChange={(open) => !open && setStockEntryProduct(null)}
        productName={stockEntryProduct?.name || ""}
        currentStock={stockEntryProduct?.stock || 0}
        currentCycle={stockEntryProduct?.cycle ?? null}
        onConfirm={async (quantity, cycle) => {
          if (!stockEntryProduct) return false;
          return await restoreStock(stockEntryProduct.id, quantity, cycle);
        }}
      />

      {/* Product Filters */}
      <ProductFilters
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
