import { describe, expect, test } from "bun:test";
import { buildAdjustmentMovement, buildMovement, computeStockDifference } from "./stockMovements";

describe("buildMovement", () => {
  test("saída de venda reduz o saldo", () => {
    const m = buildMovement(10, { movementType: "venda", quantity: -3 });
    expect(m.previousStock).toBe(10);
    expect(m.newStock).toBe(7);
    expect(m.quantity).toBe(-3);
  });

  test("entrada de mercadoria aumenta o saldo", () => {
    const m = buildMovement(4, { movementType: "entrada", quantity: 6 });
    expect(m.newStock).toBe(10);
  });

  test("devolução devolve a quantidade ao estoque", () => {
    const m = buildMovement(7, { movementType: "devolucao", quantity: 3 });
    expect(m.newStock).toBe(10);
  });
});

describe("computeStockDifference", () => {
  test("positivo quando sobrou, negativo quando faltou", () => {
    expect(computeStockDifference(10, 12)).toBe(2);
    expect(computeStockDifference(10, 8)).toBe(-2);
    expect(computeStockDifference(10, 10)).toBe(0);
  });
});

describe("buildAdjustmentMovement", () => {
  test("não cria movimentação quando não há diferença", () => {
    expect(buildAdjustmentMovement(10, 10, "Conferência")).toBeNull();
  });

  test("ajuste de conferência leva o saldo ao valor contado", () => {
    const m = buildAdjustmentMovement(10, 7, "Falta encontrada na conferência");
    expect(m.quantity).toBe(-3);
    expect(m.previousStock).toBe(10);
    expect(m.newStock).toBe(7);
  });
});
