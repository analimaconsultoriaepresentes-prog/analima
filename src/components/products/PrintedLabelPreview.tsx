import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createLabelsDocument } from "@/lib/labelGenerator";
import type { Product } from "@/hooks/useProducts";
import type { LabelModel } from "@/lib/labelPricing";

GlobalWorkerOptions.workerSrc = workerUrl;

export function PrintedLabelPreview({ product, model, labelColor, isPromotion }: {
  product?: Product; model: LabelModel | null; labelColor?: string | null; isPromotion?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!product || !model) return;
    let disposed = false;
    setError(false);
    const bytes = createLabelsDocument([{ product, quantity: 1, isPromotion: !!isPromotion }],
      { model, labelColor }).output("arraybuffer");
    const task = getDocument({ data: new Uint8Array(bytes) });
    async function render() {
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      const scale = 3;
      const viewport = page.getViewport({ scale });
      const full = document.createElement("canvas");
      full.width = viewport.width;
      full.height = viewport.height;
      await page.render({ canvas: full, viewport }).promise;
      if (disposed || !canvas.current) return;
      const target = canvas.current;
      target.width = 47 * 72 / 25.4 * scale;
      target.height = 23 * 72 / 25.4 * scale;
      target.getContext("2d")?.drawImage(full, 11 * 72 / 25.4 * scale, 10.5 * 72 / 25.4 * scale,
        target.width, target.height, 0, 0, target.width, target.height);
    }
    render().catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; void task.destroy(); };
  }, [product, model, labelColor, isPromotion]);
  if (!product || !model) return <p className="text-sm text-muted-foreground">Selecione produtos com preços compatíveis.</p>;
  if (error) return <p className="text-sm text-destructive">Não foi possível carregar a prévia.</p>;
  return <canvas ref={canvas} role="img" aria-label={`Etiqueta de ${product.name}`}
    className="w-[282px] max-w-full aspect-[47/23] border border-border" />;
}