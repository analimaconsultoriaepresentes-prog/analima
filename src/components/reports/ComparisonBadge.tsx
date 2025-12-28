import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonBadgeProps {
  percentChange: number;
  difference: number;
  trend: "up" | "down" | "stable";
  invertColors?: boolean; // For expenses, down is good
  compact?: boolean;
}

export function ComparisonBadge({
  percentChange,
  difference,
  trend,
  invertColors = false,
  compact = false,
}: ComparisonBadgeProps) {
  const isPositive = invertColors ? trend === "down" : trend === "up";
  const isNegative = invertColors ? trend === "up" : trend === "down";

  const getColorClasses = () => {
    if (trend === "stable") return "text-muted-foreground bg-muted/50";
    if (isPositive) return "text-success bg-success/10";
    return "text-destructive bg-destructive/10";
  };

  const getIcon = () => {
    if (trend === "stable") return <Minus className="w-3 h-3" />;
    if (trend === "up") return <ArrowUp className="w-3 h-3" />;
    return <ArrowDown className="w-3 h-3" />;
  };

  const formattedPercent = Math.abs(percentChange).toFixed(1);
  const formattedDiff = Math.abs(difference).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          getColorClasses()
        )}
      >
        {getIcon()}
        <span>{formattedPercent}%</span>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
          getColorClasses()
        )}
      >
        {getIcon()}
        <span>
          {trend === "up" ? "+" : trend === "down" ? "-" : ""}
          {formattedPercent}%
        </span>
        <span className="hidden sm:inline text-[10px] opacity-75">
          (R$ {trend === "up" ? "+" : trend === "down" ? "-" : ""}
          {formattedDiff})
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        vs período anterior
      </p>
    </div>
  );
}