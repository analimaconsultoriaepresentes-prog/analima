import { describe, expect, test } from "bun:test";
import { findDuplicateCandidates, findDuplicateGroups, nameSimilarity, normalizeText } from "./duplicates";

const products = [
  { id: "1", name: "Perfume Lavanda 100ml", brand: "Natura", category: "Perfume" },
  { id: "2", name: "Perfume Lavanda 50ml", brand: "Natura", category: "Perfume" },
  { id: "3", name: "Creme Hidratante", brand: "Avon", category: "Cosmético" },
  { id: "4", name: "Caneca de Porcelana", brand: "", category: "Utensílios" },
];

describe("normalizeText", () => {
  test("remove acentos, pontuação e diferenças de maiúsculas", () => {
    expect(normalizeText("Perfume Lavanda 100ml")).toBe(normalizeText("perfume lavanda 100ml"));
    expect(normalizeText("Coração")).toBe("coracao");
    expect(normalizeText("  Kit  Promoção!! ")).toBe("kit promocao");
  });
});

describe("nameSimilarity", () => {
  test("nomes iguais têm similaridade máxima", () => {
    expect(nameSimilarity("Perfume Lavanda", "perfume lavanda")).toBe(1);
  });
  test("contenção conta como muito parecido", () => {
    expect(nameSimilarity("Perfume Lavanda 100ml", "Perfume Lavanda")).toBeGreaterThanOrEqual(0.85);
  });
  test("nomes diferentes têm similaridade baixa", () => {
    expect(nameSimilarity("Perfume Lavanda", "Caneca de Porcelana")).toBeLessThan(0.45);
  });
});

describe("findDuplicateCandidates", () => {
  test("encontra nome igual como candidato mais forte", () => {
    const matches = findDuplicateCandidates(products, { name: "Perfume Lavanda 100ml", brand: "Natura", category: "Perfume" });
    expect(matches[0].product.id).toBe("1");
    expect(matches[0].reasons).toContain("Nome igual");
  });

  test("encontra variação de tamanho do mesmo produto sem bloquear", () => {
    const matches = findDuplicateCandidates(products, { name: "Perfume Lavanda 30ml", brand: "Natura", category: "Perfume" });
    const ids = matches.map((m) => m.product.id);
    expect(ids).toContain("1");
    expect(ids).toContain("2");
  });

  test("não aponta produtos totalmente diferentes", () => {
    const matches = findDuplicateCandidates(products, { name: "Caneca de Porcelana", brand: "", category: "Utensílios" });
    const ids = matches.map((m) => m.product.id);
    expect(ids).not.toContain("3");
  });

  test("exclui o próprio produto na edição", () => {
    const matches = findDuplicateCandidates(products, products[0], "1");
    expect(matches.map((m) => m.product.id)).not.toContain("1");
  });
});

describe("findDuplicateGroups", () => {
  test("agrupa variações do mesmo produto", () => {
    const groups = findDuplicateGroups(products);
    expect(groups.length).toBe(1);
    expect(groups[0].map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  test("não agrupa produtos distintos", () => {
    const groups = findDuplicateGroups([products[2], products[3]]);
    expect(groups.length).toBe(0);
  });
});
