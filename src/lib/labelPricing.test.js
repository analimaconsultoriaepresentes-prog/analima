import { describe, expect, test } from "bun:test";
import { getProductLabelModels, getCommonLabelModels, resolveLabelPrice, hasValidProductPrices, LABEL_LAYOUT } from "./labelPricing";
import { createLabelsDocument, getLabelPrices } from "./labelGenerator";

const prices = (singlePrice = null, pricePix = 0, priceCard = 0) => ({ singlePrice, pricePix, priceCard });
const product = (p) => ({ id: "test", name: "Produto 75ml", brand: "Marca", ...p });
describe("Independent product and label prices", () => {
  test("single price alone allows registration without payment prices", () => {
    expect(hasValidProductPrices({ ...prices(25), costPrice: 10, origin: "purchased", isBasket: false, productType: "item" })).toBe(true);
    expect(getProductLabelModels(prices(25))).toEqual(["single"]);
  });
  test("existing payment pair retains the dual model", () => {
    expect(getProductLabelModels(prices(null, 20, 22))).toEqual(["dual"]);
  });
  test("all three prices offer both models without changing values", () => {
    const p = prices(25, 20, 22);
    expect(getProductLabelModels(p)).toEqual(["dual", "single"]);
    expect(resolveLabelPrice(p, "single")).toBe(25);
    expect(p).toEqual(prices(25, 20, 22));
  });
  test("PIX alone uses only explicitly identified PIX", () => {
    expect(getProductLabelModels(prices(null, 20))).toEqual(["pix"]);
    expect(resolveLabelPrice(prices(null, 20), "pix")).toBe(20);
  });
  test("card alone never offers an incomplete pair", () => {
    expect(getProductLabelModels(prices(null, 0, 22))).toEqual(["card"]);
    expect(resolveLabelPrice(prices(null, 0, 22), "card")).toBe(22);
  });
  test("zero empty negative and invalid values are not registered prices", () => {
    for (const value of [0, null, undefined, NaN, Infinity, -1, "25"]) {
      expect(getProductLabelModels({ singlePrice: value, pricePix: value, priceCard: value })).toEqual([]);
    }
  });
  test("multiple selection only offers models shared by all", () => {
    expect(getCommonLabelModels([prices(25), prices(30, 28, 32)])).toEqual(["single"]);
    expect(getCommonLabelModels([prices(null, 20, 22), prices(25, 18, 24)])).toEqual(["dual"]);
    expect(getCommonLabelModels([prices(25), prices(null, 20, 22)])).toEqual([]);
  });
  test("generation rejects incompatible products rather than replacing prices", () => {
    expect(() => createLabelsDocument([{ product: product(prices(25)), quantity: 1, isPromotion: false }], { model: "dual" })).toThrow();
    expect(() => resolveLabelPrice(prices(null, 20, 22), "single")).toThrow();
  });
  test("label compatibility ignores legacy sale fallback", () => {
    expect(getProductLabelModels(getLabelPrices(product({ ...prices(null, 20, 20), labelPricePix: 20, labelPriceCard: 0 })))).toEqual(["pix"]);
  });
  test("traditional cost validation remains unchanged", () => {
    const base = { costPrice: 10, origin: "purchased", isBasket: false, productType: "item" };
    expect(hasValidProductPrices({ ...base, ...prices(null, 9, 15) })).toBe(false);
    expect(hasValidProductPrices({ ...base, ...prices(null, 11, 15) })).toBe(true);
  });
  test("47 by 23 mm labels remain 48 per A4 page", () => {
    expect(LABEL_LAYOUT).toEqual({ width: 47, height: 23, columns: 4, rows: 12, perPage: 48 });
    for (const model of ["single", "dual"]) {
      const doc = createLabelsDocument([{ product: product(prices(25, 20, 22)), quantity: 49, isPromotion: false }], { model });
      expect(doc.getNumberOfPages()).toBe(2);
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 1);
    }
  });
});