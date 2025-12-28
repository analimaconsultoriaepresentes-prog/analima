import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";
import type { Product } from "./useProducts";
import { useBaskets } from "./useBaskets";

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  cycle?: number;
  origin?: string;
}

export interface Sale {
  id: string;
  products: string[];
  total: number;
  paymentMethod: "pix" | "dinheiro" | "cartao" | "fiado";
  status: "completed" | "cancelled";
  date: string;
  time: string;
  items: SaleItem[];
  customerId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useSales() {
  const { user } = useAuth();
  const { checkBasketStock, deductBasketStock, restoreBasketStock } = useBaskets();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    if (!user) {
      setSales([]);
      setLoading(false);
      return;
    }

    try {
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("sale_items")
        .select("*, products(cycle, origin)");

      if (itemsError) throw itemsError;

      const mapped: Sale[] = (salesData || []).map((s) => {
        const saleItems = (itemsData || [])
          .filter((i) => i.sale_id === s.id)
          .map((i) => ({
            id: i.id,
            productId: i.product_id,
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            subtotal: Number(i.subtotal),
            cycle: (i.products as { cycle: number | null; origin: string | null } | null)?.cycle ?? undefined,
            origin: (i.products as { cycle: number | null; origin: string | null } | null)?.origin ?? undefined,
          }));

        const date = new Date(s.created_at);
        return {
          id: s.id,
          products: saleItems.map((i) => `${i.productName} (${i.quantity}x)`),
          total: Number(s.total),
          paymentMethod: s.payment_method as Sale["paymentMethod"],
          status: s.status as Sale["status"],
          date: date.toISOString().split("T")[0],
          time: date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          items: saleItems,
          customerId: (s as { customer_id?: string }).customer_id || undefined,
        };
      });

      setSales(mapped);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast({
        title: "Erro ao carregar vendas",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const addSale = async (
    cartItems: CartItem[],
    paymentMethod: string,
    total: number,
    updateStock: (id: string, quantity: number) => Promise<boolean>,
    products: Product[] = [],
    customerId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    // Check basket stock before proceeding
    for (const item of cartItems) {
      if (item.product.isBasket) {
        const stockCheck = await checkBasketStock(item.product.id, products);
        if (!stockCheck.hasStock) {
          const itemsList = stockCheck.missingItems.map(item => `• ${item}`).join("\n");
          toast({
            title: "Estoque insuficiente para montar esta cesta",
            description: `Não é possível vender "${item.product.name}". Itens com problema:\n${itemsList}`,
            variant: "destructive",
            duration: 8000,
          });
          return false;
        }
      }
    }

    try {
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          total,
          payment_method: paymentMethod,
          status: "completed",
          user_id: user.id,
          customer_id: customerId || null,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and get their IDs
      const saleItemsToInsert = cartItems.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.salePrice,
        subtotal: item.product.salePrice * item.quantity,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsToInsert)
        .select("id, product_id");

      if (itemsError) throw itemsError;

      // Create a map of product_id to sale_item_id
      const saleItemIdMap = new Map<string, string>();
      (insertedItems || []).forEach((item) => {
        saleItemIdMap.set(item.product_id, item.id);
      });

      // Update stock for each product
      for (const item of cartItems) {
        const saleItemId = saleItemIdMap.get(item.product.id);
        
        if (item.product.isBasket && saleItemId) {
          // For baskets, deduct stock of component items and record the deduction
          await deductBasketStock(
            item.product.id,
            item.quantity,
            updateStock,
            saleData.id,
            saleItemId
          );
        }
        // Always deduct the basket/product itself
        await updateStock(item.product.id, item.quantity);
      }

      await fetchSales();
      toast({
        title: "Venda registrada!",
        description: `Venda de R$ ${total.toLocaleString("pt-BR")} realizada com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error("Error adding sale:", error);
      toast({
        title: "Erro ao registrar venda",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelSale = async (
    saleId: string,
    restoreStock: (id: string, quantity: number, cycle?: number) => Promise<boolean>
  ): Promise<boolean> => {
    try {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) return false;

      // Update sale status
      const { error } = await supabase
        .from("sales")
        .update({ status: "cancelled" })
        .eq("id", saleId);

      if (error) throw error;

      // First, restore basket component stock if there are any
      await restoreBasketStock(saleId, restoreStock);

      // Then restore stock for each sold item (baskets and regular products)
      for (const item of sale.items) {
        await restoreStock(item.productId, item.quantity);
      }

      await fetchSales();
      toast({
        title: "Venda cancelada",
        description: "O estoque foi restaurado automaticamente.",
      });
      return true;
    } catch (error) {
      console.error("Error cancelling sale:", error);
      toast({
        title: "Erro ao cancelar venda",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Stats helpers
  const today = new Date().toISOString().split("T")[0];
  
  const todaySales = sales.filter(
    (s) => s.date === today && s.status === "completed"
  );
  
  const totalToday = todaySales.reduce((acc, s) => acc + s.total, 0);
  const countToday = todaySales.length;
  const averageTicket = countToday > 0 ? totalToday / countToday : 0;
  
  // PA - Produto por Atendimento (average items per sale)
  const totalItemsToday = todaySales.reduce(
    (acc, s) => acc + s.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0),
    0
  );
  const productPerService = countToday > 0 ? totalItemsToday / countToday : 0;

  return {
    sales,
    loading,
    addSale,
    cancelSale,
    refetch: fetchSales,
    stats: {
      totalToday,
      countToday,
      averageTicket,
      productPerService,
    },
  };
}
