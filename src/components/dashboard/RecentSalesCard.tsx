import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentSalesCardProps {
  sales: Array<{
    id: string;
    products: string;
    amount: number;
    paymentMethod: string;
    time: string;
  }>;
}

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

export function RecentSalesCard({ sales }: RecentSalesCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Vendas Recentes</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Últimas transações</p>
        </div>
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10">
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {sales.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhuma venda ainda
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex-shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">{sale.products}</p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                  <span className={cn("alert-badge text-[10px] sm:text-xs", paymentColors[sale.paymentMethod])}>
                    {paymentLabels[sale.paymentMethod]}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{sale.time}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-semibold text-success">
                  +R$ {sale.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
