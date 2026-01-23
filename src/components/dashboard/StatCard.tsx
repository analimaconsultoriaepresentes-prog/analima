import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "sales" | "financial" | "stock" | "primary" | "success" | "warning";
  className?: string;
}

const variantStyles = {
  default: {
    card: "stat-card",
    iconBg: "icon-bg-default",
  },
  sales: {
    card: "stat-card-sales",
    iconBg: "icon-bg-sales",
  },
  financial: {
    card: "stat-card-financial",
    iconBg: "icon-bg-financial",
  },
  stock: {
    card: "stat-card-stock",
    iconBg: "icon-bg-stock",
  },
  primary: {
    card: "stat-card-sales",
    iconBg: "icon-bg-sales",
  },
  success: {
    card: "stat-card-financial",
    iconBg: "icon-bg-financial",
  },
  warning: {
    card: "stat-card-stock",
    iconBg: "icon-bg-stock",
  },
};

export function StatCard({ title, value, icon, trend, variant = "default", className }: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div className={cn(styles.card, "animate-slide-up", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">{value}</p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs sm:text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
              <span className="text-muted-foreground font-normal hidden sm:inline">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={styles.iconBg}>
          {icon}
        </div>
      </div>
    </div>
  );
}
