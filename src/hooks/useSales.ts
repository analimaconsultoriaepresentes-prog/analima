import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";
import type { Product } from "./useProducts";
import { useBaskets } from "./useBaskets";
import { formatDateTimeInBrazil, getTodayInBrazil, formatDateInBrazil } from "@/lib/timezone";

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

export type SaleChannel = "store" | "online";
export type RecordType = "sale" | "donation";

export interface Sale {
  id: string;
  products: string[];
  total: number;
  paymentMethod: "pix" | "dinheiro" | "cartao" | "fiado";
  status: "completed" | "cancelled";
  channel: SaleChannel;
  recordType: RecordType;
  date: string;
  time: string;
  items: SaleItem[];
  customerId?: string;
  notes?: string;
  recipient?: string;
  referenceValue?: number;
  costTotal?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DonationData {
  notes: string;
  recipient?: string;
  referenceValue?: number;
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
        // Format date and time using Brazil timezone
        const { date: brazilDate, time: brazilTime } = formatDateTimeInBrazil(date);
        return {
          id: s.id,
          products: saleItems.map((i) => `${i.productName} (${i.quantity}x)`),
          total: Number(s.total),
          paymentMethod: s.payment_method as Sale["paymentMethod"],
          status: s.status as Sale["status"],
          channel: ((s as Record<string, unknown>).channel || "store") as SaleChannel,
          recordType: ((s as Record<string, unknown>).record_type || "sale") as RecordType,
          date: brazilDate,
          time: brazilTime,
          items: saleItems,
          customerId: (s as Record<string, unknown>).customer_id as string | undefined,
          notes: (s as Record<string, unknown>).notes as string | undefined,
          recipient: (s as Record<string, unknown>).recipient as string | undefined,
          referenceValue: (s as Record<string, unknown>).reference_value ? Number((s as Record<string, unknown>).reference_value) : undefined,
          costTotal: (s as Record<string, unknown>).cost_total ? Number((s as Record<string, unknown>).cost_total) : undefined,
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
    customerId?: string,
    channel: SaleChannel = "store",
    recordType: RecordType = "sale",
    donationData?: DonationData
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

    // Calculate cost total for tracking
    const costTotal = cartItems.reduce((sum, item) => {
      return sum + (item.product.costPrice || 0) * item.quantity;
    }, 0);

    try {
      // For donations: total revenue is 0, payment_method can be empty
      const saleTotal = recordType === "donation" ? 0 : total;
      const salePaymentMethod = recordType === "donation" ? "pix" : paymentMethod; // Default for donations

      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          total: saleTotal,
          payment_method: salePaymentMethod,
          status: "completed",
          user_id: user.id,
          customer_id: customerId || null,
          channel,
          record_type: recordType,
          notes: donationData?.notes || null,
          recipient: donationData?.recipient || null,
          reference_value: donationData?.referenceValue || null,
          cost_total: costTotal,
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
      
      if (recordType === "donation") {
        toast({
          title: "Doação registrada!",
          description: `Doação de ${cartItems.reduce((sum, i) => sum + i.quantity, 0)} itens registrada com sucesso.`,
        });
      } else {
        toast({
          title: "Venda registrada!",
          description: `Venda de R$ ${total.toLocaleString("pt-BR")} realizada com sucesso.`,
        });
      }
      return true;
    } catch (error) {
      console.error("Error adding sale:", error);
      toast({
        title: recordType === "donation" ? "Erro ao registrar doação" : "Erro ao registrar venda",
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
        title: sale.recordType === "donation" ? "Doação cancelada" : "Venda cancelada",
        description: "O estoque foi restaurado automaticamente.",
      });
      return true;
    } catch (error) {
      console.error("Error cancelling sale:", error);
      toast({
        title: "Erro ao cancelar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Stats helpers - use Brazil timezone
  const todayBrazil = getTodayInBrazil();
  
  // Filter only completed SALES (not donations) for revenue stats
  const todaySales = sales.filter(
    (s) => s.date === todayBrazil && s.status === "completed" && s.recordType === "sale"
  );
  
  // Today's donations
  const todayDonations = sales.filter(
    (s) => s.date === todayBrazil && s.status === "completed" && s.recordType === "donation"
  );
  
  // Channel breakdown (sales only)
  const storeSalesToday = todaySales.filter((s) => s.channel === "store");
  const onlineSalesToday = todaySales.filter((s) => s.channel === "online");
  
  const totalToday = todaySales.reduce((acc, s) => acc + s.total, 0);
  const countToday = todaySales.length;
  const averageTicket = countToday > 0 ? totalToday / countToday : 0;
  
  // PA - Produto por Atendimento (average items per sale - sales only)
  const totalItemsToday = todaySales.reduce(
    (acc, s) => acc + s.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0),
    0
  );
  const productPerService = countToday > 0 ? totalItemsToday / countToday : 0;

  // Channel stats (sales only)
  const storeStats = {
    total: storeSalesToday.reduce((acc, s) => acc + s.total, 0),
    count: storeSalesToday.length,
  };
  const onlineStats = {
    total: onlineSalesToday.reduce((acc, s) => acc + s.total, 0),
    count: onlineSalesToday.length,
  };

  // Donation stats
  const donationStats = {
    countToday: todayDonations.length,
    costToday: todayDonations.reduce((acc, s) => acc + (s.costTotal || 0), 0),
    itemsToday: todayDonations.reduce(
      (acc, s) => acc + s.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0),
      0
    ),
  };

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
      storeStats,
      onlineStats,
      donationStats,
    },
  };
}