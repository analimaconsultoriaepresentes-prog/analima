import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";
import type { Product } from "./useProducts";

export interface BasketItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
}

export interface BasketExtra {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface BasketComposition {
  basketId: string;
  items: BasketItem[];
  extras: BasketExtra[];
  packagingProductId?: string;
  packagingQty: number;
  packagingCost: number;
  totalItemsCost: number;
  totalExtrasCost: number;
  totalCost: number;
}

export function useBaskets() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBasketItems = async (basketId: string): Promise<BasketItem[]> => {
    try {
      const { data, error } = await supabase
        .from("basket_items")
        .select(`
          id,
          quantity,
          product_id
        `)
        .eq("basket_id", basketId);

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch products separately to avoid the relationship hint issue
      const productIds = data.map((item) => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, cost_price, sale_price")
        .in("id", productIds);

      if (productsError) throw productsError;

      const productsMap = new Map(
        (productsData || []).map((p) => [p.id, p])
      );

      return data.map((item) => {
        const product = productsMap.get(item.product_id);
        return {
          id: item.id,
          productId: item.product_id,
          productName: product?.name || "",
          quantity: item.quantity,
          costPrice: Number(product?.cost_price || 0),
          salePrice: Number(product?.sale_price || 0),
        };
      });
    } catch (error) {
      console.error("Error fetching basket items:", error);
      return [];
    }
  };

  const fetchBasketExtras = async (basketId: string): Promise<BasketExtra[]> => {
    try {
      const { data, error } = await supabase
        .from("basket_extras")
        .select("id, extra_product_id, quantity, unit_cost")
        .eq("basket_id", basketId);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch product names
      const productIds = data.map((item) => item.extra_product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      if (productsError) throw productsError;

      const productsMap = new Map((productsData || []).map((p) => [p.id, p]));

      return data.map((item) => {
        const product = productsMap.get(item.extra_product_id);
        return {
          id: item.id,
          productId: item.extra_product_id,
          productName: product?.name || "",
          quantity: item.quantity,
          unitCost: Number(item.unit_cost || 0),
        };
      });
    } catch (error) {
      console.error("Error fetching basket extras:", error);
      return [];
    }
  };

  const saveBasketItems = async (
    basketId: string,
    items: { productId: string; quantity: number }[]
  ): Promise<boolean> => {
    try {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from("basket_items")
        .delete()
        .eq("basket_id", basketId);

      if (deleteError) throw deleteError;

      // Insert new items
      if (items.length > 0) {
        const newItems = items.map((item) => ({
          basket_id: basketId,
          product_id: item.productId,
          quantity: item.quantity,
        }));

        const { error: insertError } = await supabase
          .from("basket_items")
          .insert(newItems);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error("Error saving basket items:", error);
      toast({
        title: "Erro ao salvar composição",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveBasketExtras = async (
    basketId: string,
    extras: { productId: string; quantity: number; unitCost: number }[]
  ): Promise<boolean> => {
    try {
      // Delete existing extras
      const { error: deleteError } = await supabase
        .from("basket_extras")
        .delete()
        .eq("basket_id", basketId);

      if (deleteError) throw deleteError;

      // Insert new extras
      if (extras.length > 0) {
        const newExtras = extras.map((extra) => ({
          basket_id: basketId,
          extra_product_id: extra.productId,
          quantity: extra.quantity,
          unit_cost: extra.unitCost,
        }));

        const { error: insertError } = await supabase
          .from("basket_extras")
          .insert(newExtras);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error("Error saving basket extras:", error);
      toast({
        title: "Erro ao salvar extras",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getBasketComposition = async (
    basketId: string, 
    packagingProductId: string | undefined,
    packagingQty: number,
    products: Product[]
  ): Promise<BasketComposition | null> => {
    const items = await fetchBasketItems(basketId);
    const extras = await fetchBasketExtras(basketId);
    
    const totalItemsCost = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const totalExtrasCost = extras.reduce((sum, extra) => sum + (extra.unitCost * extra.quantity), 0);
    
    // Get packaging cost from the packaging product
    let packagingCost = 0;
    if (packagingProductId) {
      const packagingProduct = products.find(p => p.id === packagingProductId);
      packagingCost = (packagingProduct?.costPrice || 0) * packagingQty;
    }
    
    return {
      basketId,
      items,
      extras,
      packagingProductId,
      packagingQty,
      packagingCost,
      totalItemsCost,
      totalExtrasCost,
      totalCost: totalItemsCost + totalExtrasCost + packagingCost,
    };
  };

  const checkBasketStock = async (basketId: string, products: Product[]): Promise<{ hasStock: boolean; missingItems: string[] }> => {
    const items = await fetchBasketItems(basketId);
    const missingItems: string[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        const available = product?.stock || 0;
        missingItems.push(`${item.productName}: disponível ${available}, necessário ${item.quantity}`);
      }
    }

    return {
      hasStock: missingItems.length === 0,
      missingItems,
    };
  };

  const deductBasketStock = async (
    basketId: string,
    quantity: number,
    updateStock: (id: string, quantity: number) => Promise<boolean>,
    saleId: string,
    saleItemId: string
  ): Promise<boolean> => {
    const items = await fetchBasketItems(basketId);
    
    // Deduct stock for each component item (multiplied by basket quantity)
    for (const item of items) {
      const totalQuantity = item.quantity * quantity;
      const success = await updateStock(item.productId, totalQuantity);
      if (!success) {
        return false;
      }
    }

    // Record the deducted components for future cancellation
    const componentsToInsert = items.map((item) => ({
      sale_id: saleId,
      sale_item_id: saleItemId,
      component_product_id: item.productId,
      component_product_name: item.productName,
      quantity_deducted: item.quantity * quantity,
    }));

    if (componentsToInsert.length > 0) {
      const { error } = await supabase
        .from("sale_basket_components")
        .insert(componentsToInsert);

      if (error) {
        console.error("Error recording basket components:", error);
        // Don't fail the sale, just log the error
      }
    }
    
    return true;
  };

  const restoreBasketStock = async (
    saleId: string,
    restoreStock: (id: string, quantity: number, cycle?: number) => Promise<boolean>
  ): Promise<boolean> => {
    try {
      // Fetch the recorded basket components for this sale
      const { data: components, error } = await supabase
        .from("sale_basket_components")
        .select("component_product_id, quantity_deducted")
        .eq("sale_id", saleId);

      if (error) throw error;

      if (!components || components.length === 0) {
        return true; // No components to restore
      }

      // Restore stock for each component
      for (const component of components) {
        await restoreStock(component.component_product_id, component.quantity_deducted);
      }

      return true;
    } catch (error) {
      console.error("Error restoring basket stock:", error);
      return false;
    }
  };

  return {
    loading,
    fetchBasketItems,
    fetchBasketExtras,
    saveBasketItems,
    saveBasketExtras,
    getBasketComposition,
    checkBasketStock,
    deductBasketStock,
    restoreBasketStock,
  };
}
