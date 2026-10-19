import { useMemo, useState } from "react";
import { ClipboardCheck, Search, Loader2, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useProducts, type Product } from "@/hooks/useProducts";
import { computeStockDifference } from "@/lib/stockMovements";
import { useSound } from "@/hooks/useSound";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Presente", "Perfume", "Cosmético", "Utensílios"];

interface PendingAdjustment {
  product: Product;
  counted: number;
  diff: number;
}

export default function ConferirEstoque() {
  const { products, loading, updateStock, restoreStock } = useProducts();
  const { playActionTick } = useSound();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [pendingAdjustments, setPendingAdjustments] = useState<PendingAdjustment[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableBrands = useMemo(() => {
    const brands = products.map((p) => p.brand).filter(Boolean) as string[];
    return brands.filter((b, i, self) => self.indexOf(b) === i).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products
      .filter((p) => p.isActive)
      .filter((p) => {
        if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
        if (brandFilter !== "all" && p.brand !== brandFilter) return false;
        if (term) {
          const matches =
            p.name.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term) ||
            (p.code || "").toLowerCase().includes(term) ||
            (p.barcode || "").toLowerCase().includes(term);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, categoryFilter, brandFilter]);

  // Produtos com contagem preenchida e diferente do registrado
  const adjustments = useMemo<PendingAdjustment[]>(() => {
    return filteredProducts
      .map((product) => {
        const raw = counts[product.id];
        if (raw === undefined || raw === "") return null;
        const counted = parseInt(raw, 10);
        if (isNaN(counted) || counted < 0) return null;
        const diff = computeStockDifference(product.stock, counted);
        if (diff === 0) return null;
        return { product, counted, diff };
      })
      .filter((a): a is PendingAdjustment => a !== null);
  }, [filteredProducts, counts]);

  const openConfirmation = (single?: PendingAdjustment) => {
    const list = single ? [single] : adjustments;
    if (list.length === 0) {
      toast({
        title: "Nada para ajustar",
        description: "Informe a quantidade contada em pelo menos um produto com diferença.",
      });
      return;
    }
    setPendingAdjustments(list);
    setIsConfirmOpen(true);
  };

  const handleConfirmAdjustments = async () => {
    setSaving(true);
    const movementReason = reason.trim() || "Conferência de estoque";
    let successCount = 0;
    let failCount = 0;

    for (const adj of pendingAdjustments) {
      const movement = { type: "conferencia" as const, reason: movementReason };
      // Usa os caminhos já existentes de estoque: a quantidade nunca é descontada duas vezes.
      const ok =
        adj.diff > 0
          ? await restoreStock(adj.product.id, adj.diff, undefined, movement)
          : await updateStock(adj.product.id, -adj.diff, movement);
      if (ok) {
        successCount++;
        // Limpa a contagem do produto ajustado
        setCounts((prev) => {
          const next = { ...prev };
          delete next[adj.product.id];
          return next;
        });
      } else {
        failCount++;
      }
    }

    setSaving(false);
    setIsConfirmOpen(false);
    setPendingAdjustments([]);

    if (successCount > 0) {
      playActionTick();
      toast({
        title: "Ajustes salvos",
        description: `${successCount} ${successCount === 1 ? "produto ajustado" : "produtos ajustados"} e registrados no histórico.`,
      });
    }
    if (failCount > 0) {
      toast({
        title: "Alguns ajustes falharam",
        description: `${failCount} ${failCount === 1 ? "produto não foi ajustado" : "produtos não foram ajustados"}. Tente novamente.`,
        variant: "destructive",
      });
    }
  };

  const setCount = (productId: string, value: string) => {
    setCounts((prev) => ({ ...prev, [productId]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            Conferir estoque
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conte os produtos fisicamente e ajuste as diferenças. Cada ajuste fica registrado no histórico.
          </p>
        </div>
        <Button
          className="btn-primary gap-2"
          onClick={() => openConfirmation()}
          disabled={adjustments.length === 0}
        >
          <CheckCircle2 className="w-4 h-4" />
          Revisar {adjustments.length > 0 ? `${adjustments.length} ` : ""}ajustes
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, marca ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-styled"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            {availableBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Motivo */}
      <div className="bg-card rounded-xl border border-border/50 p-4 space-y-2">
        <Label htmlFor="conference-reason" className="text-sm font-medium">
          Motivo da conferência (opcional)
        </Label>
        <Input
          id="conference-reason"
          placeholder="Ex: Contagem mensal, produto avariado, erro de contagem..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input-styled"
        />
        <p className="text-xs text-muted-foreground">
          Esse motivo fica gravado no histórico de cada produto ajustado.
        </p>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">Ajuste a busca ou os filtros.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden">
          {filteredProducts.map((product) => {
            const raw = counts[product.id];
            const counted = raw !== undefined && raw !== "" ? parseInt(raw, 10) : null;
            const diff = counted !== null && !isNaN(counted) ? computeStockDifference(product.stock, counted) : null;

            return (
              <div
                key={product.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.brand || "Sem marca"}
                    {product.code ? ` · Cód. ${product.code}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground">No sistema</p>
                    <p className="text-sm font-semibold text-foreground">{product.stock}</p>
                  </div>

                  <div className="w-24">
                    <p className="text-[11px] text-muted-foreground text-center">Contado</p>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="—"
                      value={raw ?? ""}
                      onChange={(e) => setCount(product.id, e.target.value)}
                      className="input-styled text-center h-9"
                    />
                  </div>

                  <div className="text-center w-20">
                    <p className="text-[11px] text-muted-foreground">Diferença</p>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        diff === null || diff === 0
                          ? "text-muted-foreground"
                          : diff > 0
                            ? "text-success"
                            : "text-destructive"
                      )}
                    >
                      {diff === null ? "—" : diff === 0 ? "OK" : diff > 0 ? `+${diff}` : diff}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={diff === null || diff === 0}
                    onClick={() =>
                      counted !== null && openConfirmation({ product, counted, diff: diff ?? 0 })
                    }
                  >
                    Ajustar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmação */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ajustes de estoque?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {pendingAdjustments.length === 1
                    ? "O estoque deste produto será atualizado:"
                    : `O estoque destes ${pendingAdjustments.length} produtos será atualizado:`}
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {pendingAdjustments.map((adj) => (
                    <div
                      key={adj.product.id}
                      className="flex items-center justify-between gap-2 text-sm rounded-md bg-muted/40 px-3 py-2"
                    >
                      <span className="text-foreground truncate">{adj.product.name}</span>
                      <span className="flex-shrink-0 text-muted-foreground">
                        {adj.product.stock} →{" "}
                        <strong className="text-foreground">{adj.counted}</strong>{" "}
                        <span className={adj.diff > 0 ? "text-success" : "text-destructive"}>
                          ({adj.diff > 0 ? `+${adj.diff}` : adj.diff})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs">
                  Motivo registrado: <strong>{reason.trim() || "Conferência de estoque"}</strong>.
                  As movimentações anteriores são mantidas no histórico.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAdjustments();
              }}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Confirmar ajustes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
