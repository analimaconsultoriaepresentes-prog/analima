import { X } from "lucide-react";
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

export interface ProductFiltersState {
  categories: string[];
  origins: string[];
  stockFilter: string;
  cycle: string;
}

interface ProductFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
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

export function ProductFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
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

  const handleStockChange = (value: string) => {
    onFiltersChange({ ...filters, stockFilter: value });
  };

  const handleCycleChange = (value: string) => {
    onFiltersChange({ ...filters, cycle: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      categories: [],
      origins: [],
      stockFilter: "all",
      cycle: "",
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.origins.length > 0 ||
    filters.stockFilter !== "all" ||
    filters.cycle !== "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de Produtos</SheetTitle>
          <SheetDescription>
            Filtre produtos por categoria, origem, estoque ou ciclo.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
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
