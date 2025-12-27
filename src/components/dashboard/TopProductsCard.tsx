import { TrendingUp } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
}

const topProducts: Product[] = [
  { id: "1", name: "Perfume Importado 100ml", category: "Perfume", sales: 45, revenue: 8550 },
  { id: "2", name: "Kit Presente Especial", category: "Presente", sales: 32, revenue: 4800 },
  { id: "3", name: "Hidratante Corporal", category: "Cosmético", sales: 28, revenue: 1680 },
  { id: "4", name: "Creme Facial Premium", category: "Cosmético", sales: 25, revenue: 2250 },
  { id: "5", name: "Caixa de Chocolates", category: "Presente", sales: 20, revenue: 1600 },
];

const categoryColors: Record<string, string> = {
  Perfume: "bg-primary/10 text-primary",
  Presente: "bg-accent/10 text-accent",
  Cosmético: "bg-success/10 text-success",
};

export function TopProductsCard() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Mais Vendidos</h3>
          <p className="text-sm text-muted-foreground">Este mês</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
          <TrendingUp className="w-4 h-4 text-success" />
        </div>
      </div>
      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={product.id} className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`alert-badge ${categoryColors[product.category]}`}>
                  {product.category}
                </span>
                <span className="text-xs text-muted-foreground">{product.sales} vendas</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                R$ {product.revenue.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
