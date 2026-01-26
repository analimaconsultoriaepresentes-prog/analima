import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export type ProductType = "item" | "packaging" | "extra" | "basket";

// Helper to check if a product is internal-only (not for sale)
export const isInternalProduct = (productType: ProductType): boolean => {
  return productType === "packaging" || productType === "extra";
};
export type GiftType = "presente" | "cesta" | "kit" | "mini_presente" | "lembrancinha";

export const GIFT_TYPE_LABELS: Record<GiftType, string> = {
  presente: "Presente",
  cesta: "Cesta",
  kit: "Kit",
  mini_presente: "Mini Presente",
  lembrancinha: "Lembrancinha",
};

export interface Product {
  id: string;
  name: string;
  category: "Presente" | "Perfume" | "Cosmético" | "Utensílios";
  brand: string;
  costPrice: number;
  salePrice: number;
  pricePix: number;
  priceCard: number;
  stock: number;
  proveQty: number; // Quantity reserved for samples/demos
  expiryDate?: string;
  origin: "purchased" | "gift";
  cycle?: number;
  isBasket: boolean;
  packagingCost: number;
  isActive: boolean;
  deletedAt?: string;
  productType: ProductType;
  packagingProductId?: string;
  packagingQty: number;
  giftType?: GiftType;
  packagingDiscount: number;
  imageUrl?: string;
}

// Helper to calculate available stock (total - prove)
export const getAvailableStock = (product: Product): number => {
  return Math.max(0, product.stock - product.proveQty);
};

export interface ProductFormData {
  name: string;
  category: "Presente" | "Perfume" | "Cosmético" | "Utensílios";
  brand: string;
  costPrice: number;
  salePrice: number;
  pricePix: number;
  priceCard: number;
  stock: number;
  proveQty: number; // Quantity reserved for samples/demos
  expiryDate?: Date;
  origin: "purchased" | "gift";
  cycle?: number;
  isBasket: boolean;
  packagingCost: number;
  productType: ProductType;
  packagingProductId?: string;
  packagingQty: number;
  giftType?: GiftType;
  packagingDiscount: number;
  imageUrl?: string;
}

// Query key for products
const PRODUCTS_QUERY_KEY = ["products"];

// Mapper function to convert DB data to Product interface
const mapDbProductToProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.category as Product["category"],
  brand: p.brand || "",
  costPrice: Number(p.cost_price),
  salePrice: Number(p.sale_price),
  pricePix: Number(p.price_pix) || Number(p.sale_price),
  priceCard: Number(p.price_card) || Number(p.sale_price),
  stock: p.stock,
  proveQty: p.prove_qty || 0,
  expiryDate: p.expiry_date || undefined,
  origin: (p.origin as Product["origin"]) || "purchased",
  cycle: p.cycle ?? undefined,
  isBasket: p.is_basket || false,
  packagingCost: Number(p.packaging_cost) || 0,
  isActive: p.is_active ?? true,
  deletedAt: p.deleted_at || undefined,
  productType: (p.product_type as ProductType) || "item",
  packagingProductId: p.packaging_product_id || undefined,
  packagingQty: p.packaging_qty || 1,
  giftType: (p.gift_type as GiftType) || undefined,
  packagingDiscount: Number(p.packaging_discount) || 0,
  imageUrl: p.image_url || undefined,
});

// Fetch products function
const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapDbProductToProduct);
};

export function useProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for fetching products
  const { data: products = [], isLoading: loading, refetch } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchProducts,
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Mutation for adding a product
  const addProductMutation = useMutation({
    mutationFn: async (data: ProductFormData): Promise<string | null> => {
      if (!user) return null;
      
      const { data: insertedData, error } = await supabase.from("products").insert({
        name: data.name,
        category: data.category,
        brand: data.brand,
        cost_price: data.costPrice,
        sale_price: data.salePrice,
        price_pix: data.pricePix,
        price_card: data.priceCard,
        stock: data.stock,
        prove_qty: data.proveQty || 0,
        expiry_date: data.expiryDate?.toISOString().split("T")[0] || null,
        user_id: user.id,
        origin: data.origin,
        cycle: data.cycle || null,
        is_basket: data.isBasket,
        packaging_cost: data.packagingCost || 0,
        product_type: data.productType || "item",
        packaging_product_id: data.packagingProductId || null,
        packaging_qty: data.packagingQty || 1,
        gift_type: data.giftType || null,
        packaging_discount: data.packagingDiscount || 0,
        image_url: data.imageUrl || null,
      }).select('id').single();

      if (error) throw error;
      return insertedData?.id || null;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast({
        title: "Produto adicionado",
        description: `${data.name} foi adicionado ao catálogo.`,
      });
    },
    onError: (error) => {
      console.error("Error adding product:", error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a product
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }): Promise<boolean> => {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          category: data.category,
          brand: data.brand,
          cost_price: data.costPrice,
          sale_price: data.salePrice,
          price_pix: data.pricePix,
          price_card: data.priceCard,
          stock: data.stock,
          prove_qty: data.proveQty || 0,
          expiry_date: data.expiryDate?.toISOString().split("T")[0] || null,
          origin: data.origin,
          cycle: data.cycle || null,
          is_basket: data.isBasket,
          packaging_cost: data.packagingCost || 0,
          product_type: data.productType || "item",
          packaging_product_id: data.packagingProductId || null,
          packaging_qty: data.packagingQty || 1,
          gift_type: data.giftType || null,
          packaging_discount: data.packagingDiscount || 0,
          image_url: data.imageUrl || null,
        })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast({
        title: "Produto atualizado",
        description: `${data.name} foi atualizado.`,
      });
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation for archiving a product
  const archiveProductMutation = useMutation({
    mutationFn: async ({ id }: { id: string; name: string }): Promise<boolean> => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast({
        title: "Produto arquivado",
        description: `${name} foi arquivado e não aparecerá mais na lista.`,
      });
    },
    onError: (error) => {
      console.error("Error archiving product:", error);
      toast({
        title: "Erro ao arquivar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation for reactivating a product
  const reactivateProductMutation = useMutation({
    mutationFn: async ({ id }: { id: string; name: string }): Promise<boolean> => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: true, deleted_at: null })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast({
        title: "Produto reativado",
        description: `${name} está ativo novamente.`,
      });
    },
    onError: (error) => {
      console.error("Error reactivating product:", error);
      toast({
        title: "Erro ao reativar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating stock (decrementing)
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }): Promise<boolean> => {
      const product = products.find((p) => p.id === id);
      if (!product) return false;

      const newStock = product.stock - quantity;
      if (newStock < 0) {
        throw new Error("Estoque insuficiente");
      }

      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Invalidate to ensure all components get updated data
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Error updating stock:", error);
      if (error.message === "Estoque insuficiente") {
        toast({
          title: "Estoque insuficiente",
          description: `Não há estoque suficiente.`,
          variant: "destructive",
        });
      }
    },
  });

  // Mutation for restoring stock (incrementing)
  const restoreStockMutation = useMutation({
    mutationFn: async ({ id, quantity, cycle }: { id: string; quantity: number; cycle?: number }): Promise<boolean> => {
      const product = products.find((p) => p.id === id);
      if (!product) return false;

      const newStock = product.stock + quantity;
      
      const updateData: { stock: number; cycle?: number } = { stock: newStock };
      if (cycle !== undefined) {
        updateData.cycle = cycle;
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Invalidate to ensure all components get updated data
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Error restoring stock:", error);
    },
  });

  const checkProductDependencies = async (id: string): Promise<{ hasSales: boolean; hasBasketUsage: boolean }> => {
    // Check if product is used in any sales
    const { data: saleItems, error: saleError } = await supabase
      .from("sale_items")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    if (saleError) {
      console.error("Error checking sale dependencies:", saleError);
    }

    // Check if product is used in any basket
    const { data: basketItems, error: basketError } = await supabase
      .from("basket_items")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    if (basketError) {
      console.error("Error checking basket dependencies:", basketError);
    }

    return {
      hasSales: (saleItems?.length || 0) > 0,
      hasBasketUsage: (basketItems?.length || 0) > 0,
    };
  };

  const deleteProduct = async (id: string, name: string, isBasket: boolean): Promise<{ success: boolean; archived: boolean; message: string }> => {
    try {
      // Check dependencies
      const deps = await checkProductDependencies(id);

      // If product has sales, archive instead of delete
      if (deps.hasSales) {
        await archiveProductMutation.mutateAsync({ id, name });
        return {
          success: true,
          archived: true,
          message: "Este item já foi usado em vendas. Para manter o histórico, ele foi arquivado.",
        };
      }

      // If product is used in a basket composition, cannot delete or archive
      if (deps.hasBasketUsage) {
        toast({
          title: "Não é possível excluir",
          description: "Este produto está sendo usado em uma cesta. Remova-o da cesta primeiro.",
          variant: "destructive",
        });
        return {
          success: false,
          archived: false,
          message: "Não é possível excluir porque está sendo usado em uma cesta.",
        };
      }

      // If it's a basket, delete its composition first
      if (isBasket) {
        const { error: basketItemsError } = await supabase
          .from("basket_items")
          .delete()
          .eq("basket_id", id);

        if (basketItemsError) {
          console.error("Error deleting basket items:", basketItemsError);
        }
      }

      // Now delete the product
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast({
        title: isBasket ? "Cesta excluída" : "Produto excluído",
        description: `${name} foi removido definitivamente.`,
      });
      return {
        success: true,
        archived: false,
        message: "Produto excluído com sucesso.",
      };
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return {
        success: false,
        archived: false,
        message: "Erro ao excluir produto.",
      };
    }
  };

  // Wrapper functions to maintain the same API
  const addProduct = async (data: ProductFormData): Promise<string | null> => {
    try {
      return await addProductMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  const updateProduct = async (id: string, data: ProductFormData): Promise<boolean> => {
    try {
      return await updateProductMutation.mutateAsync({ id, data });
    } catch {
      return false;
    }
  };

  const archiveProduct = async (id: string, name: string): Promise<boolean> => {
    try {
      return await archiveProductMutation.mutateAsync({ id, name });
    } catch {
      return false;
    }
  };

  const reactivateProduct = async (id: string, name: string): Promise<boolean> => {
    try {
      return await reactivateProductMutation.mutateAsync({ id, name });
    } catch {
      return false;
    }
  };

  const updateStock = async (id: string, quantity: number): Promise<boolean> => {
    try {
      return await updateStockMutation.mutateAsync({ id, quantity });
    } catch {
      return false;
    }
  };

  const restoreStock = async (id: string, quantity: number, cycle?: number): Promise<boolean> => {
    try {
      return await restoreStockMutation.mutateAsync({ id, quantity, cycle });
    } catch {
      return false;
    }
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    reactivateProduct,
    checkProductDependencies,
    updateStock,
    restoreStock,
    refetch,
  };
}
