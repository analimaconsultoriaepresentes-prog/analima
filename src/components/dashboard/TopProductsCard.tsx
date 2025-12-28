import { TrendingUp } from "lucide-react";

interface TopProductsCardProps {
  products: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
}

const categoryColors: Record<string, string> = {
  Perfume: "bg-primary/10 text-primary",
  Presente: "bg-accent/10 text-accent",
  Cosmético: "bg-success/10 text-success",
  Outro: "bg-warning/10 text-warning",
};

export function TopProductsCard({ products }: TopProductsCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Mais Vendidos</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Este mês</p>
        </div>
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-success/10">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhuma venda ainda
          </div>
        ) : (
          products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-muted text-xs sm:text-sm font-semibold text-muted-foreground flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">{product.name}</p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                  <span className={`alert-badge text-[10px] sm:text-xs ${categoryColors[product.category] || categoryColors.Outro}`}>
                    {product.category}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{product.quantity} vendas</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
