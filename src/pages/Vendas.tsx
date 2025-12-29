import { useState, useMemo } from "react";
import { Plus, Search, ShoppingCart, Calendar, XCircle, Loader2, Package, Gift, Globe, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SaleForm } from "@/components/sales/SaleForm";
import { useProducts } from "@/hooks/useProducts";
import { useSales, SaleChannel } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useStore } from "@/hooks/useStore";
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
import type { Sale } from "@/hooks/useSales";

const paymentLabels: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  fiado: "Fiado",
};

const paymentColors: Record<string, string> = {
  pix: "bg-accent/10 text-accent",
  dinheiro: "bg-success/10 text-success",
  cartao: "bg-primary/10 text-primary",
  fiado: "bg-warning/10 text-warning",
};

const channelLabels: Record<SaleChannel, string> = {
  store: "Loja",
  online: "Online",
};

const channelColors: Record<SaleChannel, string> = {
  store: "bg-muted text-muted-foreground",
  online: "bg-primary/10 text-primary",
};

type ChannelFilter = "all" | SaleChannel;

export default function Vendas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultChannel, setDefaultChannel] = useState<SaleChannel>("store");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [cancelSale, setCancelSale] = useState<Sale | null>(null);

  const { products, loading: loadingProducts, updateStock, restoreStock } = useProducts();
  const { sales, loading: loadingSales, addSale, cancelSale: cancelSaleAction, stats } = useSales();
  const { customers, addCustomer } = useCustomers();
  const { store } = useStore();

  // Usar custos de embalagem da configuração da loja
  const packagingCosts = store?.packagingCosts || { packagingCost1Bag: 0, packagingCost2Bags: 0 };

  const handleNewSale = async (
    cartItems: { product: typeof products[0]; quantity: number }[],
    paymentMethod: string,
    total: number,
    customerId?: string,
    channel?: SaleChannel
  ) => {
    await addSale(cartItems, paymentMethod, total, updateStock, products, customerId, channel || "store");
  };

  const handleCancelSale = async () => {
    if (!cancelSale) return;
    await cancelSaleAction(cancelSale.id, restoreStock);
    setCancelSale(null);
  };

  const openNewSale = (channel: SaleChannel) => {
    setDefaultChannel(channel);
    setIsFormOpen(true);
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.products.some((p) =>
      p.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = sale.status === "completed";
    const matchesChannel = channelFilter === "all" || sale.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const loading = loadingProducts || loadingSales;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground mt-1">Registre e acompanhe suas vendas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => openNewSale("online")}>
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Venda</span> Online
          </Button>
          <Button className="btn-primary gap-2" onClick={() => openNewSale("store")}>
            <Plus className="w-4 h-4" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendas Hoje</p>
              <p className="text-xl font-bold text-foreground">{stats.countToday}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
              <p className="text-xl font-bold text-success">
                R$ {stats.totalToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <ShoppingCart className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold text-foreground">
                R$ {stats.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <Package className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PA</p>
              <p className="text-xl font-bold text-foreground">
                {stats.productPerService.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="flex flex-wrap gap-4 text-sm animate-slide-up">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
          <Store className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Loja:</span>
          <span className="font-medium">{stats.storeStats.count} vendas</span>
          <span className="text-success font-medium">
            R$ {stats.storeStats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Online:</span>
          <span className="font-medium">{stats.onlineStats.count} vendas</span>
          <span className="text-success font-medium">
            R$ {stats.onlineStats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-styled"
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setChannelFilter("all")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              channelFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setChannelFilter("store")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5",
              channelFilter === "store"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Store className="w-3.5 h-3.5" />
            Loja
          </button>
          <button
            onClick={() => setChannelFilter("online")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5",
              channelFilter === "online"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            Online
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Sales List */}
      {!loading && (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden animate-slide-up">
          <div className="divide-y divide-border">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma venda encontrada</p>
              </div>
            ) : (
              filteredSales.map((sale, index) => (
                <div
                  key={sale.id}
                  className="p-4 hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {sale.items.map((item, idx) => (
                            <span key={item.id} className="font-medium text-foreground inline-flex items-center">
                              {item.productName}
                              {item.origin === "gift" && (
                                <Gift className="w-3.5 h-3.5 text-primary mx-0.5 flex-shrink-0" />
                              )}
                              ({item.quantity}x)
                              {item.cycle && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  C{item.cycle}
                                </span>
                              )}
                              {idx < sale.items.length - 1 && ","}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("alert-badge", channelColors[sale.channel])}>
                            {sale.channel === "online" ? <Globe className="w-3 h-3 mr-1" /> : <Store className="w-3 h-3 mr-1" />}
                            {channelLabels[sale.channel]}
                          </span>
                          <span className={cn("alert-badge", paymentColors[sale.paymentMethod])}>
                            {paymentLabels[sale.paymentMethod]}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {sale.date} às {sale.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">
                          +R$ {sale.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCancelSale(sale)}
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sale Form Modal */}
      <SaleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        products={products}
        customers={customers}
        onSubmit={handleNewSale}
        onAddCustomer={addCustomer}
        defaultChannel={defaultChannel}
        packagingCosts={packagingCosts}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelSale} onOpenChange={(open) => !open && setCancelSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta venda de{" "}
              <strong>R$ {cancelSale?.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>?
              O estoque dos produtos será restaurado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSale}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
