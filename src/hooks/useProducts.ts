import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface Product {
  id: string;
  name: string;
  category: "Presente" | "Perfume" | "Cosmético" | "Utensílios";
  brand: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  expiryDate?: string;
  origin: "purchased" | "gift";
  cycle?: number;
  isBasket: boolean;
  packagingCost: number;
  isActive: boolean;
  deletedAt?: string;
}

export interface ProductFormData {
  name: string;
  category: "Presente" | "Perfume" | "Cosmético" | "Utensílios";
  brand: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  expiryDate?: Date;
  origin: "purchased" | "gift";
  cycle?: number;
  isBasket: boolean;
  packagingCost: number;
}

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Product[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category as Product["category"],
        brand: p.brand || "",
        costPrice: Number(p.cost_price),
        salePrice: Number(p.sale_price),
        stock: p.stock,
        expiryDate: p.expiry_date || undefined,
        origin: (p.origin as Product["origin"]) || "purchased",
        cycle: p.cycle ?? undefined,
        isBasket: p.is_basket || false,
        packagingCost: Number(p.packaging_cost) || 0,
        isActive: p.is_active ?? true,
        deletedAt: p.deleted_at || undefined,
      }));

      setProducts(mapped);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const addProduct = async (data: ProductFormData): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data: insertedData, error } = await supabase.from("products").insert({
        name: data.name,
        category: data.category,
        brand: data.brand,
        cost_price: data.costPrice,
        sale_price: data.salePrice,
        stock: data.stock,
        expiry_date: data.expiryDate?.toISOString().split("T")[0] || null,
        user_id: user.id,
        origin: data.origin,
        cycle: data.cycle || null,
        is_basket: data.isBasket,
        packaging_cost: data.packagingCost || 0,
      }).select('id').single();

      if (error) throw error;

      await fetchProducts();
      toast({
        title: "Produto adicionado",
        description: `${data.name} foi adicionado ao catálogo.`,
      });
      return insertedData?.id || null;
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProduct = async (id: string, data: ProductFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          category: data.category,
          brand: data.brand,
          cost_price: data.costPrice,
          sale_price: data.salePrice,
          stock: data.stock,
          expiry_date: data.expiryDate?.toISOString().split("T")[0] || null,
          origin: data.origin,
          cycle: data.cycle || null,
          is_basket: data.isBasket,
          packaging_cost: data.packagingCost || 0,
        })
        .eq("id", id);

      if (error) throw error;

      await fetchProducts();
      toast({
        title: "Produto atualizado",
        description: `${data.name} foi atualizado.`,
      });
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

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

  const archiveProduct = async (id: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      await fetchProducts();
      toast({
        title: "Produto arquivado",
        description: `${name} foi arquivado e não aparecerá mais na lista.`,
      });
      return true;
    } catch (error) {
      console.error("Error archiving product:", error);
      toast({
        title: "Erro ao arquivar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const reactivateProduct = async (id: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: true, deleted_at: null })
        .eq("id", id);

      if (error) throw error;

      await fetchProducts();
      toast({
        title: "Produto reativado",
        description: `${name} está ativo novamente.`,
      });
      return true;
    } catch (error) {
      console.error("Error reactivating product:", error);
      toast({
        title: "Erro ao reativar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteProduct = async (id: string, name: string, isBasket: boolean): Promise<{ success: boolean; archived: boolean; message: string }> => {
    try {
      // Check dependencies
      const deps = await checkProductDependencies(id);

      // If product has sales, archive instead of delete
      if (deps.hasSales) {
        await archiveProduct(id, name);
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

      await fetchProducts();
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

  const updateStock = async (id: string, quantity: number): Promise<boolean> => {
    try {
      const product = products.find((p) => p.id === id);
      if (!product) return false;

      const newStock = product.stock - quantity;
      if (newStock < 0) {
        toast({
          title: "Estoque insuficiente",
          description: `Não há estoque suficiente.`,
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
      );
      return true;
    } catch (error) {
      console.error("Error updating stock:", error);
      return false;
    }
  };

  const restoreStock = async (id: string, quantity: number, cycle?: number): Promise<boolean> => {
    try {
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

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock, cycle: cycle ?? p.cycle } : p))
      );
      return true;
    } catch (error) {
      console.error("Error restoring stock:", error);
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
    refetch: fetchProducts,
  };
}
