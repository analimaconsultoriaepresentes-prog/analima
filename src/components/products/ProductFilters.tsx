import { X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilter = "active" | "archived" | "all";
export type ProductTypeFilter = "all" | "item" | "basket" | "packaging" | "extra";
export type SortField = "name" | "stock" | "pricePix" | "cycle";
export type SortDirection = "asc" | "desc";

export interface ProductFiltersState {
  categories: string[];
  origins: string[];
  brands: string[];
  productType: ProductTypeFilter;
  stockFilter: string;
  cycle: string;
  statusFilter: StatusFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface ProductFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  availableBrands: string[];
}

const CATEGORIES = ["Presente", "Perfume", "Cosmético", "Utensílios"];
const ORIGINS = [
  { value: "purchased", label: "Comprado" },
  { value: "gift", label: "Brinde" },
];
const STOCK_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "inStock", label: "Com estoque" },
  { value: "lowStock", label: "Estoque baixo (≤5)" },
  { value: "outOfStock", label: "Sem estoque" },
];
const STATUS_OPTIONS = [
  { value: "active", label: "Ativos" },
  { value: "archived", label: "Arquivados" },
  { value: "all", label: "Todos" },
];
const TYPE_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "item", label: "Produto" },
  { value: "basket", label: "Presente/Cesta" },
  { value: "packaging", label: "Embalagem" },
  { value: "extra", label: "Extra" },
];
const SORT_OPTIONS = [
  { value: "name", label: "Nome" },
  { value: "stock", label: "Estoque" },
  { value: "pricePix", label: "Preço Pix" },
  { value: "cycle", label: "Ciclo" },
];

export function ProductFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  availableBrands,
}: ProductFiltersProps) {
  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleOriginToggle = (origin: string) => {
    const newOrigins = filters.origins.includes(origin)
      ? filters.origins.filter((o) => o !== origin)
      : [...filters.origins, origin];
    onFiltersChange({ ...filters, origins: newOrigins });
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFiltersChange({ ...filters, brands: newBrands });
  };

  const handleStockChange = (value: string) => {
    onFiltersChange({ ...filters, stockFilter: value });
  };

  const handleCycleChange = (value: string) => {
    onFiltersChange({ ...filters, cycle: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, statusFilter: value as StatusFilter });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, productType: value as ProductTypeFilter });
  };

  const handleSortFieldChange = (value: string) => {
    onFiltersChange({ ...filters, sortField: value as SortField });
  };

  const handleSortDirectionToggle = () => {
    onFiltersChange({
      ...filters,
      sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
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
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.origins.length > 0 ||
    filters.brands.length > 0 ||
    filters.productType !== "all" ||
    filters.stockFilter !== "all" ||
    filters.cycle !== "" ||
    filters.statusFilter !== "active";

  // Get unique brands from available brands
  const uniqueBrands = availableBrands.filter((brand, index, self) => 
    brand && self.indexOf(brand) === index
  ).sort();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de Produtos</SheetTitle>
          <SheetDescription>
            Filtre e ordene produtos por diversos critérios.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Ordenação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Ordenar por
            </Label>
            <div className="flex gap-2">
              <Select value={filters.sortField} onValueChange={handleSortFieldChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSortDirectionToggle}
                title={filters.sortDirection === "asc" ? "Crescente" : "Decrescente"}
              >
                <ArrowUpDown className={`w-4 h-4 transition-transform ${filters.sortDirection === "desc" ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Tipo de Produto */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo</Label>
            <Select value={filters.productType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categorias */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Marca */}
          {uniqueBrands.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Marca</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {uniqueBrands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.brands.includes(brand)}
                      onCheckedChange={() => handleBrandToggle(brand)}
                    />
                    <span className="text-sm">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Origem */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Origem do Produto</Label>
            <div className="flex flex-col gap-2">
              {ORIGINS.map((origin) => (
                <label
                  key={origin.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.origins.includes(origin.value)}
                    onCheckedChange={() => handleOriginToggle(origin.value)}
                  />
                  <span className="text-sm">{origin.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Estoque */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Estoque</Label>
            <Select value={filters.stockFilter} onValueChange={handleStockChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ciclo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ciclo</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 1, 2, 3..."
              value={filters.cycle}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="input-styled"
            />
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={filters.statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </Button>
            <Button
              className="flex-1 btn-primary"
              onClick={() => onOpenChange(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
