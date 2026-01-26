import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Filter, Package, Loader2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductForm, type BasketItemInput, type BasketExtraInput } from "@/components/products/ProductForm";
import { StockEntryModal } from "@/components/products/StockEntryModal";
import { ProductFilters, type ProductFiltersState } from "@/components/products/ProductFilters";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductMobileList } from "@/components/products/ProductMobileList";
import { ProductCardGrid } from "@/components/products/ProductCardGrid";
import { ViewModeToggle } from "@/components/products/ViewModeToggle";
import { KitCalculator } from "@/components/products/KitCalculator";
import { useProducts, type Product, type ProductFormData } from "@/hooks/useProducts";
import { useBaskets } from "@/hooks/useBaskets";
import { useIsMobile } from "@/hooks/use-mobile";
import { useViewMode } from "@/hooks/useViewMode";
import { useSound } from "@/hooks/useSound";
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

export default function Produtos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isKitCalculatorOpen, setIsKitCalculatorOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] = useState<Product | null>(null);
  const [archiveConfirmState, setArchiveConfirmState] = useState<Product | null>(null);
  const [stockEntryProduct, setStockEntryProduct] = useState<Product | null>(null);
  const [editBasketItems, setEditBasketItems] = useState<BasketItemInput[]>([]);
  const [editBasketExtras, setEditBasketExtras] = useState<BasketExtraInput[]>([]);
  const [openAsGift, setOpenAsGift] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { playActionTick } = useSound();
  const [filters, setFilters] = useState<ProductFiltersState>({
    categories: [],
    origins: [],
    brands: [],
    productType: "all",
    stockFilter: "all",
    cycle: "",
    statusFilter: "active",
    sortField: "name",
    sortDirection: "asc",
  });

  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useViewMode("list");
  const { products, loading, addProduct, updateProduct, deleteProduct, archiveProduct, reactivateProduct, checkProductDependencies, restoreStock } = useProducts();
  const { saveBasketItems, saveBasketExtras, fetchBasketItems, fetchBasketExtras } = useBaskets();

  // Handle openGift query param from Getting Started guide
  useEffect(() => {
    if (searchParams.get('openGift') === 'true') {
      setOpenAsGift(true);
      setIsFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Get unique brands for filter
  const availableBrands = useMemo(() => {
    return products.map(p => p.brand).filter(Boolean) as string[];
  }, [products]);

  // Filter out baskets and archived products for basket composition
  const availableProductsForBasket = useMemo(() => {
    return products.filter((p) => !p.isBasket && p.isActive);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // Status filter (active/archived/all)
      if (filters.statusFilter === "active" && !product.isActive) return false;
      if (filters.statusFilter === "archived" && product.isActive) return false;

      // Text search
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Origin filter
      if (filters.origins.length > 0 && !filters.origins.includes(product.origin)) {
        return false;
      }

      // Product type filter
      if (filters.productType !== "all") {
        if (filters.productType === "basket" && !product.isBasket) return false;
        if (filters.productType === "item" && (product.isBasket || product.productType !== "item")) return false;
        if (filters.productType === "packaging" && product.productType !== "packaging") return false;
        if (filters.productType === "extra" && product.productType !== "extra") return false;
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

    // Sort products
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "stock":
          comparison = a.stock - b.stock;
          break;
        case "pricePix":
          comparison = a.pricePix - b.pricePix;
          break;
        case "cycle":
          comparison = (a.cycle || 0) - (b.cycle || 0);
          break;
      }
      return filters.sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, filters]);

  // Inventory summary for header - uses available stock (total - prove)
  const inventorySummary = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive);
    return {
      totalProducts: activeProducts.length,
      // Valor em estoque = (estoque disponível × custo unitário)
      // Estoque disponível = stock - proveQty (unidades reservadas como PROVE)
      totalValue: activeProducts.reduce((sum, p) => {
        const availableStock = Math.max(0, p.stock - p.proveQty);
        return sum + (availableStock * p.costPrice);
      }, 0),
    };
  }, [products]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.origins.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.productType !== "all") count++;
    if (filters.stockFilter !== "all") count++;
    if (filters.cycle !== "") count++;
    if (filters.statusFilter !== "active") count++;
    return count;
  }, [filters]);

  const handleAddProduct = async (data: ProductFormData, basketItems?: BasketItemInput[], basketExtras?: BasketExtraInput[]) => {
    const productId = await addProduct(data);
    if (productId) {
      if (data.isBasket) {
        if (basketItems && basketItems.length > 0) {
          await saveBasketItems(
            productId,
            basketItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }))
          );
        }
        if (basketExtras && basketExtras.length > 0) {
          await saveBasketExtras(
            productId,
            basketExtras.map((extra) => ({
              productId: extra.productId,
              quantity: extra.quantity,
              unitCost: extra.unitCost,
            }))
          );
        }
      }
      playActionTick(); // Sound when product is created
      setIsFormOpen(false);
    }
  };

  const handleEditProduct = async (data: ProductFormData, basketItems?: BasketItemInput[], basketExtras?: BasketExtraInput[]) => {
    if (!editProduct) return;
    const success = await updateProduct(editProduct.id, data);
    if (success) {
      if (data.isBasket) {
        if (basketItems) {
          await saveBasketItems(
            editProduct.id,
            basketItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }))
          );
        }
        if (basketExtras) {
          await saveBasketExtras(
            editProduct.id,
            basketExtras.map((extra) => ({
              productId: extra.productId,
              quantity: extra.quantity,
              unitCost: extra.unitCost,
            }))
          );
        }
      }
      playActionTick(); // Sound when product is updated
      setEditProduct(null);
      setEditBasketItems([]);
      setEditBasketExtras([]);
      setIsFormOpen(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductState) return;
    await deleteProduct(deleteProductState.id, deleteProductState.name, deleteProductState.isBasket);
    setDeleteProductState(null);
  };

  const handleArchiveProduct = async () => {
    if (!archiveConfirmState) return;
    await archiveProduct(archiveConfirmState.id, archiveConfirmState.name);
    setArchiveConfirmState(null);
  };

  const handleReactivateProduct = async (product: Product) => {
    await reactivateProduct(product.id, product.name);
  };

  const handleProductAction = async (product: Product, action: "archive" | "delete") => {
    if (action === "archive") {
      setArchiveConfirmState(product);
    } else {
      const deps = await checkProductDependencies(product.id);
      
      if (deps.hasSales) {
        setArchiveConfirmState(product);
      } else if (deps.hasBasketUsage) {
        await deleteProduct(product.id, product.name, product.isBasket);
      } else {
        setDeleteProductState(product);
      }
    }
  };

  const openEditModal = async (product: Product) => {
    setEditProduct(product);
    
    if (product.isBasket) {
      const [items, extras] = await Promise.all([
        fetchBasketItems(product.id),
        fetchBasketExtras(product.id),
      ]);
      setEditBasketItems(
        items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          salePrice: item.salePrice,
        }))
      );
      setEditBasketExtras(
        extras.map((extra) => ({
          productId: extra.productId,
          productName: extra.productName,
          quantity: extra.quantity,
          unitCost: extra.unitCost,
        }))
      );
    } else {
      setEditBasketItems([]);
      setEditBasketExtras([]);
    }
    
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditProduct(null);
      setEditBasketItems([]);
      setEditBasketExtras([]);
      setOpenAsGift(false);
    }
  };

  const handleToggleSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {inventorySummary.totalProducts} produtos | Valor em estoque: R$ {inventorySummary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsKitCalculatorOpen(true)}>
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calculadora de Kit</span>
            <span className="sm:hidden">Kit</span>
          </Button>
          <Button className="btn-primary gap-2" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search, Filters and View Toggle */}
      <div className="flex flex-col gap-3 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-styled"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 relative"
              onClick={() => setIsFiltersOpen(true)}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {!isMobile && (
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            )}
          </div>
        </div>
        {isMobile && (
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        )}
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

      {/* No Results */}
      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros ou termo de busca.</p>
        </div>
      )}

      {/* Products View */}
      {!loading && filteredProducts.length > 0 && (
        <>
          {isMobile ? (
            viewMode === "list" ? (
              <ProductMobileList
                products={filteredProducts}
                onEdit={openEditModal}
                onStockEntry={(product) => setStockEntryProduct(product)}
                onArchive={(product) => handleProductAction(product, "archive")}
                onDelete={(product) => handleProductAction(product, "delete")}
                onReactivate={handleReactivateProduct}
              />
            ) : (
              <ProductCardGrid
                products={filteredProducts}
                onEdit={openEditModal}
                onStockEntry={(product) => setStockEntryProduct(product)}
                onArchive={(product) => handleProductAction(product, "archive")}
                onDelete={(product) => handleProductAction(product, "delete")}
                onReactivate={handleReactivateProduct}
              />
            )
          ) : viewMode === "list" ? (
            <ProductTable
              products={filteredProducts}
              onEdit={openEditModal}
              onStockEntry={(product) => setStockEntryProduct(product)}
              onArchive={(product) => handleProductAction(product, "archive")}
              onDelete={(product) => handleProductAction(product, "delete")}
              onReactivate={handleReactivateProduct}
            />
          ) : (
            <ProductCardGrid
              products={filteredProducts}
              onEdit={openEditModal}
              onStockEntry={(product) => setStockEntryProduct(product)}
              onArchive={(product) => handleProductAction(product, "archive")}
              onDelete={(product) => handleProductAction(product, "delete")}
              onReactivate={handleReactivateProduct}
            />
          )}
        </>
      )}

      {/* Product Form Modal */}
      <ProductForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editProduct ? handleEditProduct : handleAddProduct}
        editProduct={editProduct}
        availableProducts={availableProductsForBasket}
        initialBasketItems={editBasketItems}
        initialBasketExtras={editBasketExtras}
        defaultAsGift={openAsGift}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductState} onOpenChange={(open) => !open && setDeleteProductState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteProductState?.isBasket ? "cesta" : "produto"} definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteProductState?.name}</strong> permanentemente?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveConfirmState} onOpenChange={(open) => !open && setArchiveConfirmState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {archiveConfirmState?.isBasket ? "cesta" : "produto"}?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{archiveConfirmState?.name}</strong> será arquivado e não aparecerá mais na lista de produtos ativos, 
              nem estará disponível para novas vendas. Você pode reativá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveProduct}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Arquivar
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
        availableBrands={availableBrands}
      />

      {/* Kit Calculator */}
      <KitCalculator
        open={isKitCalculatorOpen}
        onOpenChange={setIsKitCalculatorOpen}
        availableProducts={availableProductsForBasket}
        onSaveAsBasket={async (data, basketItems) => {
          const productId = await addProduct(data);
          if (productId && basketItems.length > 0) {
            await saveBasketItems(productId, basketItems);
          }
        }}
        onCreateProduct={addProduct}
      />
    </div>
  );
}
