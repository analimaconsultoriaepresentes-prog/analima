import { useState, useMemo, useEffect } from "react";
import { useProducts, Product, isInternalProduct } from "@/hooks/useProducts";
import { useStore } from "@/hooks/useStore";
import { useHelp } from "@/components/help/HelpContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tag,
  Search,
  FileDown,
  Printer,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateLabelsPDF } from "@/lib/labelGenerator";

interface SelectedProduct {
  product: Product;
  quantity: number;
}

export default function Etiquetas() {
  const { products, loading } = useProducts();
  const { store } = useStore();
  const { setCurrentPage } = useHelp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [generating, setGenerating] = useState(false);

  // Set help context for this page
  useEffect(() => {
    setCurrentPage("etiquetas");
  }, [setCurrentPage]);

  // Filter only active, sellable products
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (isInternalProduct(p.productType)) return false;
      return true;
    });
  }, [products]);

  // Filter by search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return availableProducts;
    const term = searchTerm.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [availableProducts, searchTerm]);

  const toggleProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      newSelected.set(product.id, { product, quantity: 1 });
    }
    setSelectedProducts(newSelected);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newSelected = new Map(selectedProducts);
    const item = newSelected.get(productId);
    if (item) {
      const newQty = Math.max(1, item.quantity + delta);
      newSelected.set(productId, { ...item, quantity: newQty });
      setSelectedProducts(newSelected);
    }
  };

  const setQuantity = (productId: string, quantity: number) => {
    const newSelected = new Map(selectedProducts);
    const item = newSelected.get(productId);
    if (item) {
      newSelected.set(productId, { ...item, quantity: Math.max(1, quantity) });
      setSelectedProducts(newSelected);
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Map());
  };

  const totalLabels = useMemo(() => {
    let total = 0;
    selectedProducts.forEach((item) => {
      total += item.quantity;
    });
    return total;
  }, [selectedProducts]);

  const totalPages = Math.ceil(totalLabels / 48);

  const handleGeneratePDF = async (action: "download" | "print") => {
    if (selectedProducts.size === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para gerar etiquetas.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const items = Array.from(selectedProducts.values());
      await generateLabelsPDF(items, action, { labelColor: store?.labelColor });
      
      toast({
        title: action === "download" ? "PDF gerado com sucesso" : "Enviando para impressão",
        description: `${totalLabels} etiquetas em ${totalPages} página(s).`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
            Etiquetas
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione produtos e gere etiquetas para impressão
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Product Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Produtos Disponíveis
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-4 pt-0">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum produto encontrado
                  </p>
                ) : (
                  filteredProducts.map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                        onClick={() => toggleProduct(product)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand} • {product.category}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-success font-medium">
                            R$ {product.pricePix.toFixed(2).replace(".", ",")}
                          </p>
                          <p className="text-muted-foreground">
                            R$ {product.priceCard.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Selected Products & Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Produtos Selecionados
                  {selectedProducts.size > 0 && (
                    <Badge variant="secondary">{selectedProducts.size}</Badge>
                  )}
                </CardTitle>
                {selectedProducts.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                <div className="space-y-2 p-4 pt-0">
                  {selectedProducts.size === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Selecione produtos para gerar etiquetas
                    </p>
                  ) : (
                    Array.from(selectedProducts.values()).map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, -1);
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1)}
                            className="w-14 h-7 text-center text-sm px-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, 1);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Summary & Actions */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de etiquetas</p>
                  <p className="text-2xl font-bold text-foreground">{totalLabels}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Páginas A4</p>
                  <p className="text-2xl font-bold text-foreground">{totalPages}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                48 etiquetas por folha A4 (47mm x 23mm)
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleGeneratePDF("download")}
                  disabled={generating || selectedProducts.size === 0}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4 mr-2" />
                  )}
                  Baixar PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGeneratePDF("print")}
                  disabled={generating || selectedProducts.size === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Label Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Prévia da Etiqueta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <LabelPreview 
                  product={Array.from(selectedProducts.values()).pop()?.product} 
                  labelColor={store?.labelColor}
                />
              </div>
              {selectedProducts.size > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Mostrando: {Array.from(selectedProducts.values()).pop()?.product.name}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper to extract volume from product name
function extractVolume(name: string): string | null {
  const match = name.match(/(\d+)\s*(ml|ML|g|G|kg|KG)/i);
  if (match) {
    return `${match[1]}${match[2].toUpperCase()}`;
  }
  return null;
}

// Helper to format product name (remove volume)
function formatProductName(name: string): string {
  return name.replace(/\s*\d+\s*(ml|ML|g|G|kg|KG)/i, "").trim().toUpperCase();
}

// Label preview component showing the exact layout
function LabelPreview({ product, labelColor }: { product?: Product; labelColor?: string | null }) {
  const displayName = product ? formatProductName(product.name) : "NOME DO PRODUTO";
  const volume = product ? extractVolume(product.name) : "75ML";
  const pricePix = product ? product.pricePix : 89.90;
  const priceCard = product ? product.priceCard : 99.90;
  
  // Default purple gradient or custom color
  const bgStyle = labelColor 
    ? { background: labelColor }
    : { background: "linear-gradient(135deg, hsl(280, 85%, 50%) 0%, hsl(320, 80%, 55%) 100%)" };

  return (
    <div
      className="border-2 border-dashed border-primary/30 rounded overflow-hidden transition-all duration-300"
      style={{ width: "188px", height: "92px" }} // 4x scale for preview (47mm x 23mm)
    >
      {/* Top colored band */}
      <div
        className="w-full flex items-center justify-between px-2"
        style={{
          height: "52px",
          ...bgStyle,
        }}
      >
        <span className="text-white font-bold text-xs leading-tight flex-1 line-clamp-2">
          {displayName}
        </span>
        {volume && (
          <span className="text-white/90 text-[10px] font-medium ml-1 whitespace-nowrap">
            {volume}
          </span>
        )}
      </div>

      {/* Bottom white area with prices */}
      <div
        className="w-full bg-white flex items-center justify-around px-2"
        style={{ height: "40px" }}
      >
        <div className="text-center">
          <p className="text-[8px] text-muted-foreground leading-none">CARTÃO</p>
          <p className="text-xs font-bold text-foreground leading-tight">
            R$ {priceCard.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="text-center">
          <p className="text-[8px] text-success leading-none">PIX</p>
          <p className="text-xs font-bold text-success leading-tight">
            R$ {pricePix.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>
    </div>
  );
}
