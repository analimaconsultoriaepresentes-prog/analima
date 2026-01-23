import { useState, useEffect, useRef } from "react";
import { Percent, DollarSign, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSound } from "@/hooks/useSound";

export type DiscountType = "fixed" | "percentage";

export interface DiscountData {
  type: DiscountType;
  value: number;
  reason: string;
}

interface DiscountBlockProps {
  subtotal: number;
  discount: DiscountData;
  onDiscountChange: (discount: DiscountData) => void;
}

export function DiscountBlock({ subtotal, discount, onDiscountChange }: DiscountBlockProps) {
  const [localValue, setLocalValue] = useState(discount.value.toString());
  const { playActionTick } = useSound();
  const prevValueRef = useRef(discount.value);

  useEffect(() => {
    setLocalValue(discount.value.toString());
  }, [discount.value]);

  // Play sound when discount goes from 0 to > 0
  useEffect(() => {
    if (prevValueRef.current === 0 && discount.value > 0) {
      playActionTick();
    }
    prevValueRef.current = discount.value;
  }, [discount.value, playActionTick]);

  const handleTypeChange = (type: DiscountType) => {
    onDiscountChange({ ...discount, type, value: 0 });
    setLocalValue("0");
  };

  const handleValueChange = (rawValue: string) => {
    setLocalValue(rawValue);
    const numValue = parseFloat(rawValue) || 0;
    
    if (discount.type === "percentage") {
      // Clamp to 0-100
      const clampedValue = Math.max(0, Math.min(100, numValue));
      onDiscountChange({ ...discount, value: clampedValue });
    } else {
      // Clamp to 0-subtotal
      const clampedValue = Math.max(0, Math.min(subtotal, numValue));
      onDiscountChange({ ...discount, value: clampedValue });
    }
  };

  const handleReasonChange = (reason: string) => {
    onDiscountChange({ ...discount, reason });
  };

  // Calculate discount preview
  const calculatedDiscount = discount.type === "percentage" 
    ? subtotal * (discount.value / 100)
    : discount.value;

  const hasDiscount = discount.value > 0;

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border/50">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary" />
        <Label className="text-sm font-semibold">Aplicar Desconto</Label>
      </div>

      {/* Type Toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => handleTypeChange("fixed")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium transition-colors",
            discount.type === "fixed"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted/50"
          )}
        >
          <DollarSign className="w-4 h-4" />
          Valor (R$)
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("percentage")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium transition-colors",
            discount.type === "percentage"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Percent className="w-4 h-4" />
          Percentual (%)
        </button>
      </div>

      {/* Value Input */}
      <div className="relative">
        <Input
          type="number"
          min="0"
          max={discount.type === "percentage" ? 100 : subtotal}
          step="0.01"
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={() => setLocalValue(discount.value.toString())}
          className="pr-12 text-lg font-medium"
          placeholder="0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          {discount.type === "percentage" ? "%" : "R$"}
        </span>
      </div>

      {/* Preview */}
      {hasDiscount && (
        <div className="flex items-center justify-between text-sm bg-success/10 text-success rounded-lg px-3 py-2">
          <span>Desconto aplicado:</span>
          <span className="font-bold">
            - R$ {calculatedDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Reason (optional) */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Motivo (opcional)</Label>
        <Textarea
          value={discount.reason}
          onChange={(e) => handleReasonChange(e.target.value)}
          placeholder="Ex: Cliente VIP, promoção..."
          className="resize-none min-h-[60px] text-sm"
          maxLength={200}
        />
      </div>
    </div>
  );
}
