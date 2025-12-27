import { useState } from "react";
import { Plus, Search, Filter, Package, AlertTriangle, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProductForm, type ProductFormData } from "@/components/products/ProductForm";
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
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  category: "Presente" | "Perfume" | "Cosmético";
  brand: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  expiryDate?: string;
}

const initialProducts: Product[] = [
  { id: "1", name: "Perfume Dolce & Gabbana Light Blue", category: "Perfume", brand: "D&G", costPrice: 150, salePrice: 280, stock: 3, expiryDate: "2025-12-01" },
  { id: "2", name: "Kit Presente Natura Ekos", category: "Presente", brand: "Natura", costPrice: 85, salePrice: 150, stock: 8 },
  { id: "3", name: "Hidratante Corporal Nivea 400ml", category: "Cosmético", brand: "Nivea", costPrice: 25, salePrice: 45, stock: 15, expiryDate: "2025-01-15" },
  { id: "4", name: "Perfume 212 Carolina Herrera", category: "Perfume", brand: "CH", costPrice: 200, salePrice: 350, stock: 5 },
  { id: "5", name: "Creme Facial L'Oréal", category: "Cosmético", brand: "L'Oréal", costPrice: 45, salePrice: 90, stock: 2, expiryDate: "2025-03-20" },
  { id: "6", name: "Caixa de Chocolates Ferrero", category: "Presente", brand: "Ferrero", costPrice: 40, salePrice: 80, stock: 12 },
];

const categoryColors: Record<string, string> = {
  Perfume: "bg-primary/10 text-primary",
  Presente: "bg-accent/10 text-accent",
  Cosmético: "bg-success/10 text-success",
};

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMargin = (cost: number, sale: number) => {
    return ((sale - cost) / sale * 100).toFixed(1);
  };

  const handleAddProduct = (data: ProductFormData) => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category,
      brand: data.brand,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      stock: data.stock,
      expiryDate: data.expiryDate?.toISOString().split("T")[0],
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleEditProduct = (data: ProductFormData) => {
    if (!editProduct) return;
    setProducts(prev =>
      prev.map(p =>
        p.id === editProduct.id
          ? {
              ...p,
              name: data.name,
              category: data.category,
              brand: data.brand,
              costPrice: data.costPrice,
              salePrice: data.salePrice,
              stock: data.stock,
              expiryDate: data.expiryDate?.toISOString().split("T")[0],
            }
          : p
      )
    );
    setEditProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!deleteProduct) return;
    setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
    toast({
      title: "Produto excluído",
      description: `${deleteProduct.name} foi removido do catálogo.`,
    });
    setDeleteProduct(null);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditProduct(null);
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
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="bg-card rounded-xl border border-border/50 p-5 shadow-sm card-hover animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
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
                  <DropdownMenuItem onClick={() => openEditModal(product)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteProduct(product)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={cn("alert-badge", categoryColors[product.category])}>
                {product.category}
              </span>
              {product.stock <= 5 && (
                <span className="alert-badge alert-badge-warning flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Estoque baixo
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
                <p className="text-muted-foreground">Estoque</p>
                <p className={cn("font-semibold", product.stock <= 5 ? "text-warning" : "text-foreground")}>
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

      {/* Product Form Modal */}
      <ProductForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editProduct ? handleEditProduct : handleAddProduct}
        editProduct={editProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteProduct?.name}</strong>? 
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
    </div>
  );
}
