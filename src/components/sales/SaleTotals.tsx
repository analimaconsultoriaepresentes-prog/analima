import { TrendingUp, Tag, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaleTotalsProps {
  subtotal: number;
  discountAmount: number;
  total: number;
  profit: number;
  profitMargin: number;
}

export function SaleTotals({ 
  subtotal, 
  discountAmount, 
  total, 
  profit, 
  profitMargin 
}: SaleTotalsProps) {
  const hasDiscount = discountAmount > 0;

  return (
    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Subtotal
        </span>
        <span className="font-medium text-foreground">
          R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Discount */}
      {hasDiscount && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-success flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Desconto
          </span>
          <span className="font-medium text-success">
            - R$ {discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Total a Pagar
        </span>
        <span className="text-2xl font-bold text-primary">
          R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Profit */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        profit >= 0 
          ? "bg-success/10 border border-success/20" 
          : "bg-destructive/10 border border-destructive/20"
      )}>
        <span className={cn(
          "font-medium flex items-center gap-2",
          profit >= 0 ? "text-success" : "text-destructive"
        )}>
          <TrendingUp className="w-4 h-4" />
          Lucro Estimado
        </span>
        <div className="text-right">
          <span className={cn(
            "text-xl font-bold",
            profit >= 0 ? "text-success" : "text-destructive"
          )}>
            R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <span className={cn(
            "text-xs ml-2",
            profit >= 0 ? "text-success/80" : "text-destructive/80"
          )}>
            ({profitMargin.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
