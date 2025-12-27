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
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

export function StatCard({ title, value, icon, trend, variant = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "stat-card animate-slide-up",
        variant === "primary" && "border-primary/20 bg-primary/5",
        variant === "success" && "border-success/20 bg-success/5",
        variant === "warning" && "border-warning/20 bg-warning/5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
              <span className="text-muted-foreground font-normal">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          variant === "default" && "bg-muted",
          variant === "primary" && "bg-primary/10 text-primary",
          variant === "success" && "bg-success/10 text-success",
          variant === "warning" && "bg-warning/10 text-warning"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
