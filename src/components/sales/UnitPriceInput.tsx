import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseUnitPrice } from "@/lib/salePricing";

interface Props {
  productId: string;
  productName: string;
  price: number;
  onChange: (price: number | null) => void;
}

export function UnitPriceInput({ productId, productName, price, onChange }: Props) {
  const [draft, setDraft] = useState(price.toFixed(2).replace(".", ","));
  const [focused, setFocused] = useState(false);
  const invalid = parseUnitPrice(draft) === null;

  useEffect(() => {
    if (!focused && !invalid) setDraft(price.toFixed(2).replace(".", ","));
  }, [price, focused, invalid]);

  return (
    <div className="mt-1 space-y-1">
      <Label htmlFor={`unit-price-${productId}`} className="text-xs text-muted-foreground">Preço unitário (R$)</Label>
      <Input
        id={`unit-price-${productId}`}
        aria-label={`Preço unitário (R$) de ${productName}`}
        aria-invalid={invalid}
        inputMode="decimal"
        value={draft}
        className="h-8 w-full text-sm"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(parseUnitPrice(event.target.value));
        }}
      />
      {invalid && <p className="text-xs text-destructive">Informe um valor válido com até 2 casas decimais.</p>}
    </div>
  );
}