import { ShoppingCart, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/help";
import type { RecordType } from "@/hooks/useSales";

interface RecordTypeSelectorProps {
  recordType: RecordType;
  onRecordTypeChange: (type: RecordType) => void;
}

export function RecordTypeSelector({
  recordType,
  onRecordTypeChange,
}: RecordTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>Tipo de registro</span>
      </div>
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => onRecordTypeChange("sale")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
            recordType === "sale"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Venda
        </button>
        <button
          type="button"
          onClick={() => onRecordTypeChange("donation")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
            recordType === "donation"
              ? "bg-accent text-accent-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Heart className="w-4 h-4" />
          Doação
          <HelpTooltip fieldKey="doacao" position="top" />
        </button>
      </div>
    </div>
  );
}