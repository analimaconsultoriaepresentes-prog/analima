export interface SalePriceProduct {
  salePrice: number;
  pricePix?: number;
  priceCard?: number;
}

export interface PricedCartItem {
  product: SalePriceProduct;
  quantity: number;
  unitPrice?: number | null;
}

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function parseUnitPrice(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? roundMoney(price) : null;
}

export function getCartItemPrice(item: PricedCartItem, paymentMethod: string): number {
  if (item.unitPrice !== undefined) return item.unitPrice ?? 0;
  const card = ["credito", "debito", "cartao"].includes(paymentMethod);
  return roundMoney((card ? item.product.priceCard : item.product.pricePix) || item.product.salePrice);
}

export function hasValidCartPrices(items: PricedCartItem[]): boolean {
  return items.every((item) => item.unitPrice === undefined ||
    (typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) && item.unitPrice >= 0 && roundMoney(item.unitPrice) === item.unitPrice));
}

export function getCartSubtotal(items: PricedCartItem[], paymentMethod: string): number {
  return roundMoney(items.reduce((sum, item) => sum + roundMoney(getCartItemPrice(item, paymentMethod) * item.quantity), 0));
}

export function snapshotCartItems<T extends PricedCartItem>(items: T[], paymentMethod: string) {
  return items.map((item) => ({ ...item, unitPrice: getCartItemPrice(item, paymentMethod) }));
}