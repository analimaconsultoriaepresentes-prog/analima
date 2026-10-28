export interface LabelPrices {
  singlePrice?: number | null;
  pricePix: number;
  priceCard: number;
}

export type LabelModel = "dual" | "single" | "pix" | "card";
export const LABEL_MODELS: { value: LabelModel; title: string }[] = [
  { value: "dual", title: "PIX + Cartão" },
  { value: "single", title: "Valor único" },
  { value: "pix", title: "Somente PIX / Dinheiro" },
  { value: "card", title: "Somente Cartão" },
];
export const LABEL_LAYOUT = { width: 47, height: 23, columns: 4, rows: 12, perPage: 48 };

export function isPositivePrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function getProductLabelModels(product: LabelPrices): LabelModel[] {
  const models: LabelModel[] = [];
  const pix = isPositivePrice(product.pricePix);
  const card = isPositivePrice(product.priceCard);
  if (pix && card) models.push("dual");
  if (isPositivePrice(product.singlePrice)) models.push("single");
  // Explicit payment-only models apply only when the traditional pair is incomplete.
  if (pix && !card) models.push("pix");
  if (card && !pix) models.push("card");
  return models;
}

export function getCommonLabelModels(products: LabelPrices[]): LabelModel[] {
  if (!products.length) return [];
  return LABEL_MODELS.map(m => m.value).filter(model =>
    products.every(product => getProductLabelModels(product).includes(model))
  );
}

export function resolveLabelPrice(product: LabelPrices, model: LabelModel): number {
  if (!getProductLabelModels(product).includes(model) || model === "dual") {
    throw new Error("Produto incompatível com o modelo de etiqueta selecionado.");
  }
  const price = model === "single" ? product.singlePrice : model === "pix" ? product.pricePix : product.priceCard;
  if (!isPositivePrice(price)) throw new Error("Preço ausente ou inválido.");
  return price;
}

export interface ProductPriceValidation extends LabelPrices {
  costPrice: number;
  productType: string;
  isBasket: boolean;
  origin: string;
}

export function hasValidProductPrices(data: Partial<ProductPriceValidation>): boolean {
  if (data.productType === "packaging" || data.productType === "extra") return true;
  if (isPositivePrice(data.singlePrice)) return true;
  if (data.isBasket || data.origin === "gift") return isPositivePrice(data.pricePix) && isPositivePrice(data.priceCard);
  return typeof data.costPrice === "number" && isPositivePrice(data.pricePix) && isPositivePrice(data.priceCard)
    && data.pricePix > data.costPrice && data.priceCard > data.costPrice;
}