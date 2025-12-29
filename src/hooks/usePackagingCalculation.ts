import { useMemo } from "react";
import type { Product } from "./useProducts";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PackagingConfig {
  packagingProductId?: string;
  packagingQtyPerItem: number;
}

export interface SaleCostBreakdown {
  // What customer pays (only sale prices)
  totalCliente: number;
  // Internal costs
  custoItens: number;
  custoEmbalagem: number;
  custoTotal: number;
  // Profit calculations
  lucroReal: number;
  margemReal: number; // percentage
  // Item counts
  itemCount: number;
  looseItemCount: number; // items that are not baskets
}

/**
 * Hook to calculate packaging costs and real profit for sales
 * 
 * Rules:
 * 1. Loose products (avulsos): packaging cost is internal only, NOT charged to customer
 * 2. Baskets/Combos: packaging is already included in costPrice, ignore additional packaging
 * 3. Customer always pays only the sale_price sum
 */
export function usePackagingCalculation(
  cartItems: CartItem[],
  allProducts: Product[],
  packagingConfig?: PackagingConfig
) {
  const breakdown = useMemo<SaleCostBreakdown>(() => {
    if (cartItems.length === 0) {
      return {
        totalCliente: 0,
        custoItens: 0,
        custoEmbalagem: 0,
        custoTotal: 0,
        lucroReal: 0,
        margemReal: 0,
        itemCount: 0,
        looseItemCount: 0,
      };
    }

    let totalCliente = 0;
    let custoItens = 0;
    let looseItemCount = 0;

    for (const item of cartItems) {
      const qty = item.quantity;
      
      // Customer pays only sale_price
      totalCliente += item.product.salePrice * qty;
      
      // Internal cost calculation
      custoItens += item.product.costPrice * qty;
      
      // Count loose items (non-baskets) for packaging calculation
      if (!item.product.isBasket) {
        looseItemCount += qty;
      }
      // Note: Baskets already have packaging included in their costPrice
    }

    // Calculate packaging cost for loose items only
    let custoEmbalagem = 0;
    if (packagingConfig?.packagingProductId && looseItemCount > 0) {
      const packagingProduct = allProducts.find(
        (p) => p.id === packagingConfig.packagingProductId
      );
      if (packagingProduct) {
        // Calculate how many packaging units needed
        const packagingUnitsNeeded = Math.ceil(
          looseItemCount / (packagingConfig.packagingQtyPerItem || 1)
        );
        custoEmbalagem = packagingProduct.costPrice * packagingUnitsNeeded;
      }
    }

    const custoTotal = custoItens + custoEmbalagem;
    const lucroReal = totalCliente - custoTotal;
    const margemReal = totalCliente > 0 ? (lucroReal / totalCliente) * 100 : 0;

    return {
      totalCliente,
      custoItens,
      custoEmbalagem,
      custoTotal,
      lucroReal,
      margemReal,
      itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      looseItemCount,
    };
  }, [cartItems, allProducts, packagingConfig]);

  return breakdown;
}

/**
 * Calculate profit breakdown for a completed sale
 * Used in reports and sale details
 */
export function calculateSaleProfitBreakdown(
  saleItems: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>,
  products: Product[],
  defaultPackagingCostPerItem: number = 0
): SaleCostBreakdown {
  if (saleItems.length === 0) {
    return {
      totalCliente: 0,
      custoItens: 0,
      custoEmbalagem: 0,
      custoTotal: 0,
      lucroReal: 0,
      margemReal: 0,
      itemCount: 0,
      looseItemCount: 0,
    };
  }

  let totalCliente = 0;
  let custoItens = 0;
  let looseItemCount = 0;

  for (const item of saleItems) {
    const product = products.find((p) => p.id === item.productId);
    const qty = item.quantity;

    // What customer paid
    totalCliente += item.subtotal;

    if (product) {
      // Internal cost
      custoItens += product.costPrice * qty;

      // Count loose items (non-baskets)
      if (!product.isBasket) {
        looseItemCount += qty;
      }
    }
  }

  // Estimate packaging cost for loose items
  const custoEmbalagem = looseItemCount * defaultPackagingCostPerItem;
  const custoTotal = custoItens + custoEmbalagem;
  const lucroReal = totalCliente - custoTotal;
  const margemReal = totalCliente > 0 ? (lucroReal / totalCliente) * 100 : 0;

  return {
    totalCliente,
    custoItens,
    custoEmbalagem,
    custoTotal,
    lucroReal,
    margemReal,
    itemCount: saleItems.reduce((acc, item) => acc + item.quantity, 0),
    looseItemCount,
  };
}
