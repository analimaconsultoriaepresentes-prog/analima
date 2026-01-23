import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, User, DollarSign } from "lucide-react";

interface DonationFieldsProps {
  notes: string;
  onNotesChange: (value: string) => void;
  recipient: string;
  onRecipientChange: (value: string) => void;
  referenceValue: string;
  onReferenceValueChange: (value: string) => void;
  compact?: boolean;
}

export function DonationFields({
  notes,
  onNotesChange,
  recipient,
  onRecipientChange,
  referenceValue,
  onReferenceValueChange,
  compact = false,
}: DonationFieldsProps) {
  return (
    <div className="space-y-3 p-3 border border-accent/30 rounded-xl bg-accent/5">
      <div className="flex items-center gap-2 text-accent">
        <Heart className="w-4 h-4" />
        <span className="text-sm font-medium">Dados da Doação</span>
      </div>

      {/* Notes/Reason - Required */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Motivo / Observação *
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Ex: Doação para cliente VIP, amostra grátis..."
          className="min-h-[60px] resize-none"
          required
        />
      </div>

      {/* Recipient - Optional */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <User className="w-3 h-3" />
          Destinatário (opcional)
        </Label>
        <Input
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
          placeholder="Nome do destinatário"
          className={compact ? "h-9" : ""}
        />
      </div>

      {/* Reference Value - Optional */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <DollarSign className="w-3 h-3" />
          Valor de referência (opcional)
        </Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={referenceValue}
          onChange={(e) => onReferenceValueChange(e.target.value)}
          placeholder="0,00"
          className={compact ? "h-9" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Valor de mercado dos itens (não entra no faturamento)
        </p>
      </div>
    </div>
  );
}