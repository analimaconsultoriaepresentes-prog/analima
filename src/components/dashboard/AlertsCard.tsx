import { AlertTriangle, Package, Calendar, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "stock" | "expiry" | "payment";
  title: string;
  description: string;
  urgent: boolean;
}

const alerts: Alert[] = [
  {
    id: "1",
    type: "stock",
    title: "Estoque baixo",
    description: "Perfume Dolce & Gabbana - Apenas 3 unidades",
    urgent: true,
  },
  {
    id: "2",
    type: "expiry",
    title: "Validade próxima",
    description: "Creme Nivea 200ml - Vence em 15 dias",
    urgent: false,
  },
  {
    id: "3",
    type: "payment",
    title: "Conta a pagar",
    description: "Fornecedor ABC - R$ 850,00 vence amanhã",
    urgent: true,
  },
  {
    id: "4",
    type: "stock",
    title: "Estoque baixo",
    description: "Kit Presente Natura - Apenas 2 unidades",
    urgent: false,
  },
];

const iconMap = {
  stock: Package,
  expiry: Calendar,
  payment: CreditCard,
};

const colorMap = {
  stock: "text-warning bg-warning/10",
  expiry: "text-info bg-info/10",
  payment: "text-destructive bg-destructive/10",
};

export function AlertsCard() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alertas</h3>
          <p className="text-sm text-muted-foreground">Itens que precisam de atenção</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
          <AlertTriangle className="w-4 h-4 text-destructive" />
        </div>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type];
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                alert.urgent ? "border-destructive/20 bg-destructive/5" : "border-border/50"
              )}
            >
              <div className={cn("p-2 rounded-lg", colorMap[alert.type])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  {alert.urgent && (
                    <span className="alert-badge alert-badge-danger">Urgente</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
