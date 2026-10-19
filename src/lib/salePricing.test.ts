import { describe, expect, test } from "bun:test";
import { getCartItemPrice, getCartSubtotal, hasValidCartPrices, parseUnitPrice, snapshotCartItems } from "./salePricing";

const product = { salePrice: 20, pricePix: 18, priceCard: 22 };

describe("Sale-specific unit prices", () => {
  test("starts with the registered payment price", () => {
    expect(getCartItemPrice({ product, quantity: 1 }, "pix")).toBe(18);
    expect(getCartItemPrice({ product, quantity: 1 }, "credito")).toBe(22);
  });
  test("accepts prices greater and lower than the original without changing the catalog", () => {
    expect(getCartItemPrice({ product, quantity: 1, unitPrice: 30 }, "pix")).toBe(30);
    expect(getCartItemPrice({ product, quantity: 1, unitPrice: 10 }, "credito")).toBe(10);
    expect(product.salePrice).toBe(20);
    expect(product.pricePix).toBe(18);
  });
  test("recalculates quantities and unit prices with cents", () => {
    expect(getCartSubtotal([{ product, quantity: 2, unitPrice: 12.35 }], "pix")).toBe(24.70);
    expect(getCartSubtotal([{ product, quantity: 3, unitPrice: 12.35 }], "pix")).toBe(37.05);
    expect(getCartSubtotal([{ product, quantity: 3, unitPrice: 0.1 }], "pix")).toBe(0.3);
  });
  test("snapshots the practiced price and preserves it across payment changes", () => {
    const items = snapshotCartItems([{ product, quantity: 2, unitPrice: 12.35 }], "pix");
    expect(items[0].unitPrice).toBe(12.35);
    expect(getCartSubtotal(items, "cartao")).toBe(24.70);
    expect(snapshotCartItems([{ product, quantity: 1 }], "credito")[0].unitPrice).toBe(22);
  });
  test("validates numeric nonnegative values with up to two decimals", () => {
    expect(parseUnitPrice("12,35")).toBe(12.35);
    expect(parseUnitPrice("12.35")).toBe(12.35);
    expect(parseUnitPrice("0")).toBe(0);
    for (const value of ["", "-1", "abc", "1.234", "Infinity"]) expect(parseUnitPrice(value)).toBeNull();
    for (const value of [null, NaN, Infinity, -1, 1.234]) expect(hasValidCartPrices([{ product, quantity: 1, unitPrice: value }])).toBe(false);
  });
});