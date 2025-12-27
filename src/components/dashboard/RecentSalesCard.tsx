import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  product: string;
  amount: number;
  paymentMethod: "pix" | "dinheiro" | "cartao" | "fiado";
  time: string;
}

const recentSales: Sale[] = [
  { id: "1", product: "Perfume Importado 100ml", amount: 190, paymentMethod: "pix", time: "Há 5 min" },
  { id: "2", product: "Kit Presente Especial", amount: 150, paymentMethod: "cartao", time: "Há 15 min" },
  { id: "3", product: "Hidratante + Creme", amount: 120, paymentMethod: "dinheiro", time: "Há 30 min" },
  { id: "4", product: "Creme Facial Premium", amount: 90, paymentMethod: "pix", time: "Há 1 hora" },
  { id: "5", product: "Sabonete Artesanal", amount: 35, paymentMethod: "fiado", time: "Há 2 horas" },
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

export function RecentSalesCard() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Vendas Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimas transações</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <ShoppingBag className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="space-y-4">
        {recentSales.map((sale) => (
          <div key={sale.id} className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{sale.product}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("alert-badge", paymentColors[sale.paymentMethod])}>
                  {paymentLabels[sale.paymentMethod]}
                </span>
                <span className="text-xs text-muted-foreground">{sale.time}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-success">
                +R$ {sale.amount.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
