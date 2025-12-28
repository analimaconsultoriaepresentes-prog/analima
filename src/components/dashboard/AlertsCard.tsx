import { AlertTriangle, Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsCardProps {
  lowStock: Array<{ id: string; name: string; stock: number }>;
  expiring: Array<{ id: string; name: string; expiryDate: string }>;
}

export function AlertsCard({ lowStock, expiring }: AlertsCardProps) {
  const alerts = [
    ...lowStock.map((p) => ({
      id: `stock-${p.id}`,
      type: "stock" as const,
      title: "Estoque baixo",
      description: `${p.name} - ${p.stock} unidades`,
      urgent: p.stock <= 2,
    })),
    ...expiring.map((p) => ({
      id: `exp-${p.id}`,
      type: "expiry" as const,
      title: "Validade próxima",
      description: `${p.name} - Vence ${p.expiryDate}`,
      urgent: false,
    })),
  ];

  const iconMap = {
    stock: Package,
    expiry: Calendar,
  };

  const colorMap = {
    stock: "text-warning bg-warning/10",
    expiry: "text-info bg-info/10",
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Alertas</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Itens que precisam de atenção</p>
        </div>
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhum alerta no momento
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => {
            const Icon = iconMap[alert.type];
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                  alert.urgent ? "border-destructive/20 bg-destructive/5" : "border-border/50"
                )}
              >
                <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", colorMap[alert.type])}>
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{alert.title}</p>
                    {alert.urgent && (
                      <span className="alert-badge alert-badge-danger text-[10px] sm:text-xs">Urgente</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{alert.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
