import { useState, useEffect } from "react";
import { Banknote, CreditCard, Smartphone, Clock, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PaymentMethod = "pix" | "dinheiro" | "credito" | "debito";

interface PaymentMethodSelectorProps {
  total: number;
  selectedMethod: PaymentMethod | "";
  onMethodChange: (method: PaymentMethod) => void;
  amountReceived: number;
  onAmountReceivedChange: (amount: number) => void;
}

const paymentMethods = [
  { 
    value: "dinheiro" as PaymentMethod, 
    label: "Dinheiro", 
    icon: Banknote,
    color: "bg-success/10 text-success border-success/30",
    activeColor: "bg-success text-success-foreground"
  },
  { 
    value: "pix" as PaymentMethod, 
    label: "PIX", 
    icon: Smartphone,
    color: "bg-accent/10 text-accent border-accent/30",
    activeColor: "bg-accent text-accent-foreground"
  },
  { 
    value: "credito" as PaymentMethod, 
    label: "Crédito", 
    icon: CreditCard,
    color: "bg-primary/10 text-primary border-primary/30",
    activeColor: "bg-primary text-primary-foreground"
  },
  { 
    value: "debito" as PaymentMethod, 
    label: "Débito", 
    icon: CreditCard,
    color: "bg-warning/10 text-warning border-warning/30",
    activeColor: "bg-warning text-warning-foreground"
  },
];

export function PaymentMethodSelector({
  total,
  selectedMethod,
  onMethodChange,
  amountReceived,
  onAmountReceivedChange,
}: PaymentMethodSelectorProps) {
  const [localAmount, setLocalAmount] = useState(amountReceived.toString());

  useEffect(() => {
    if (amountReceived > 0) {
      setLocalAmount(amountReceived.toString());
    }
  }, [amountReceived]);

  const handleAmountChange = (rawValue: string) => {
    setLocalAmount(rawValue);
    const numValue = parseFloat(rawValue) || 0;
    onAmountReceivedChange(numValue);
  };

  const change = selectedMethod === "dinheiro" && amountReceived >= total 
    ? amountReceived - total 
    : 0;

  const showChangeBlock = selectedMethod === "dinheiro";

  // Quick amount buttons
  const quickAmounts = [
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
    Math.ceil(total / 50) * 50,
  ].filter((amount, index, self) => 
    amount >= total && self.indexOf(amount) === index
  ).slice(0, 4);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" />
        Forma de Pagamento
      </Label>

      {/* Payment Method Grid */}
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.value;
          
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onMethodChange(method.value)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2 transition-all font-medium",
                isSelected
                  ? method.activeColor + " border-transparent shadow-md"
                  : method.color + " hover:opacity-80"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{method.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cash Change Block */}
      {showChangeBlock && (
        <div className="bg-success/5 rounded-xl p-4 space-y-3 border border-success/20">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-success" />
            <Label className="text-sm font-medium text-success">Cálculo de Troco</Label>
          </div>

          {/* Quick Amount Buttons */}
          {quickAmounts.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setLocalAmount(amount.toString());
                    onAmountReceivedChange(amount);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    amountReceived === amount
                      ? "bg-success text-success-foreground"
                      : "bg-success/10 text-success hover:bg-success/20"
                  )}
                >
                  R$ {amount}
                </button>
              ))}
            </div>
          )}

          {/* Amount Received Input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor Recebido</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={localAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={() => setLocalAmount(amountReceived > 0 ? amountReceived.toString() : "")}
                className="pl-10 text-lg font-medium"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Change Display */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            change > 0 
              ? "bg-success text-success-foreground" 
              : amountReceived > 0 && amountReceived < total 
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
          )}>
            <span className="font-medium">
              {amountReceived > 0 && amountReceived < total ? "Falta:" : "Troco:"}
            </span>
            <span className="text-xl font-bold">
              R$ {(amountReceived > 0 && amountReceived < total 
                ? total - amountReceived 
                : change
              ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
