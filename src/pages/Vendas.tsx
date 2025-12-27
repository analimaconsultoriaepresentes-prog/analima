import { useState } from "react";
import { Plus, Search, ShoppingCart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  products: string[];
  total: number;
  paymentMethod: "pix" | "dinheiro" | "cartao" | "fiado";
  date: string;
  time: string;
}

const sales: Sale[] = [
  { id: "1", products: ["Perfume D&G 100ml", "Creme Nivea"], total: 325, paymentMethod: "pix", date: "2024-01-15", time: "14:30" },
  { id: "2", products: ["Kit Presente Natura"], total: 150, paymentMethod: "cartao", date: "2024-01-15", time: "12:15" },
  { id: "3", products: ["Hidratante Corporal"], total: 45, paymentMethod: "dinheiro", date: "2024-01-15", time: "10:00" },
  { id: "4", products: ["Perfume 212 CH", "Sabonete Artesanal"], total: 385, paymentMethod: "pix", date: "2024-01-14", time: "16:45" },
  { id: "5", products: ["Caixa de Chocolates"], total: 80, paymentMethod: "fiado", date: "2024-01-14", time: "11:20" },
];

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

export default function Vendas() {
  const [searchTerm, setSearchTerm] = useState("");

  const totalToday = sales
    .filter(sale => sale.date === "2024-01-15")
    .reduce((acc, sale) => acc + sale.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground mt-1">Registre e acompanhe suas vendas</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nova Venda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendas Hoje</p>
              <p className="text-xl font-bold text-foreground">{sales.filter(s => s.date === "2024-01-15").length}</p>
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
              <p className="text-xl font-bold text-success">R$ {totalToday.toLocaleString('pt-BR')}</p>
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
              <p className="text-xl font-bold text-foreground">R$ {(totalToday / 3).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar vendas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-styled"
        />
      </div>

      {/* Sales List */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden animate-slide-up">
        <div className="divide-y divide-border">
          {sales.map((sale, index) => (
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
                    <p className="font-medium text-foreground">{sale.products.join(", ")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("alert-badge", paymentColors[sale.paymentMethod])}>
                        {paymentLabels[sale.paymentMethod]}
                      </span>
                      <span className="text-sm text-muted-foreground">{sale.date} às {sale.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">+R$ {sale.total.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
