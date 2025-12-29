import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { useStore } from "./useStore";

interface DashboardStats {
  // Today
  salesToday: number;
  revenueToday: number;
  ticketToday: number;
  paToday: number;
  // Month
  salesMonth: number;
  revenueMonth: number;
  ticketMonth: number;
  paMonth: number;
  // Last month for trends
  revenueLastMonth: number;
  // Products with low stock
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
  // Expiring soon
  expiringProducts: Array<{ id: string; name: string; expiryDate: string }>;
  // Recent sales
  recentSales: Array<{
    id: string;
    products: string;
    amount: number;
    paymentMethod: string;
    time: string;
  }>;
  // Top products
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
  // Chart data (last 7 months)
  monthlyData: Array<{
    name: string;
    vendas: number;
    despesas: number;
  }>;
  // Category distribution
  categoryData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function useDashboardData() {
  const { user } = useAuth();
  const { store } = useStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    revenueToday: 0,
    ticketToday: 0,
    paToday: 0,
    salesMonth: 0,
    revenueMonth: 0,
    ticketMonth: 0,
    paMonth: 0,
    revenueLastMonth: 0,
    lowStockProducts: [],
    expiringProducts: [],
    recentSales: [],
    topProducts: [],
    monthlyData: [],
    categoryData: [],
  });

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));

      // Fetch sales for current month
      const { data: salesData } = await supabase
        .from("sales")
        .select("id, total, payment_method, status, created_at")
        .eq("status", "completed")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString())
        .order("created_at", { ascending: false });

      // Fetch sale items for current month
      const saleIds = (salesData || []).map((s) => s.id);
      const { data: saleItemsData } = await supabase
        .from("sale_items")
        .select("sale_id, product_id, product_name, quantity, subtotal")
        .in("sale_id", saleIds.length > 0 ? saleIds : ["none"]);

      // Fetch sales for last month (for trend)
      const { data: lastMonthSales } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Fetch ACTIVE products only (not deleted, not archived)
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, category, stock, expiry_date, is_basket, is_active, deleted_at")
        .eq("is_active", true)
        .is("deleted_at", null);

      // Calculate today's stats
      const todaySales = (salesData || []).filter((s) =>
        s.created_at.startsWith(todayStr)
      );
      const revToday = todaySales.reduce((acc, s) => acc + Number(s.total), 0);
      const countToday = todaySales.length;

      const todayItems = (saleItemsData || []).filter((i) =>
        todaySales.some((s) => s.id === i.sale_id)
      );
      const itemsCountToday = todayItems.reduce(
        (acc, i) => acc + i.quantity,
        0
      );

      // Calculate month stats
      const revMonth = (salesData || []).reduce(
        (acc, s) => acc + Number(s.total),
        0
      );
      const countMonth = (salesData || []).length;
      const itemsCountMonth = (saleItemsData || []).reduce(
        (acc, i) => acc + i.quantity,
        0
      );

      // Last month revenue
      const revLastMonth = (lastMonthSales || []).reduce(
        (acc, s) => acc + Number(s.total),
        0
      );

      // Get alert settings from store (use defaults if not loaded)
      const lowStockEnabled = store?.alertSettings?.lowStockEnabled ?? true;
      const lowStockThreshold = store?.alertSettings?.lowStockThreshold ?? 3;
      const expiryAlertEnabled = store?.alertSettings?.expiryAlertEnabled ?? true;
      const expiryDaysBefore = store?.alertSettings?.expiryDaysBefore ?? 30;

      // Low stock products - calculated dynamically from current data
      // Rules:
      // 1. Only if low_stock_enabled is true
      // 2. Only simple products (NOT baskets/combos)
      // 3. Product must be active and not deleted
      // 4. Stock must be LESS THAN threshold
      const lowStock = lowStockEnabled
        ? (productsData || [])
            .filter((p) => 
              !p.is_basket && // Exclude baskets/combos
              p.is_active && // Must be active
              p.deleted_at === null && // Must not be deleted
              p.stock < lowStockThreshold // Stock below threshold
            )
            .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))
            .slice(0, 5)
        : [];

      // Expiring products - calculated dynamically
      // Only if expiry_alert_enabled is true
      const daysFromNow = new Date();
      daysFromNow.setDate(daysFromNow.getDate() + expiryDaysBefore);
      const expiring = expiryAlertEnabled
        ? (productsData || [])
            .filter((p) => {
              if (!p.expiry_date) return false;
              if (!p.is_active || p.deleted_at !== null) return false; // Must be active and not deleted
              const expDate = new Date(p.expiry_date);
              return expDate <= daysFromNow && expDate >= today;
            })
            .map((p) => ({ id: p.id, name: p.name, expiryDate: p.expiry_date! }))
            .slice(0, 5)
        : [];

      // Recent sales (last 5)
      const recent = (salesData || []).slice(0, 5).map((s) => {
        const items = (saleItemsData || []).filter((i) => i.sale_id === s.id);
        const prodNames = items
          .map((i) => i.product_name)
          .slice(0, 2)
          .join(", ");
        const date = new Date(s.created_at);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let timeStr = "";
        if (diffMins < 60) {
          timeStr = `Há ${diffMins} min`;
        } else if (diffMins < 1440) {
          timeStr = `Há ${Math.floor(diffMins / 60)} hora${Math.floor(diffMins / 60) > 1 ? "s" : ""}`;
        } else {
          timeStr = format(date, "dd/MM");
        }
        return {
          id: s.id,
          products: prodNames + (items.length > 2 ? ` +${items.length - 2}` : ""),
          amount: Number(s.total),
          paymentMethod: s.payment_method,
          time: timeStr,
        };
      });

      // Top products by quantity sold this month
      const productSales: Record<
        string,
        { name: string; category: string; quantity: number; revenue: number }
      > = {};
      (saleItemsData || []).forEach((i) => {
        const prod = (productsData || []).find((p) => p.id === i.product_id);
        if (!productSales[i.product_id]) {
          productSales[i.product_id] = {
            name: i.product_name,
            category: prod?.category || "Outro",
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[i.product_id].quantity += i.quantity;
        productSales[i.product_id].revenue += Number(i.subtotal);
      });
      const topProds = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Category distribution
      const categoryTotals: Record<string, number> = {};
      (saleItemsData || []).forEach((i) => {
        const prod = (productsData || []).find((p) => p.id === i.product_id);
        const cat = prod?.category || "Outro";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(i.subtotal);
      });
      const totalRevenue = Object.values(categoryTotals).reduce(
        (a, b) => a + b,
        0
      );
      const categoryColors: Record<string, string> = {
        Perfume: "hsl(var(--primary))",
        Presente: "hsl(var(--accent))",
        Cosmético: "hsl(var(--success))",
        Outro: "hsl(var(--warning))",
      };
      const catData = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0,
        color: categoryColors[name] || "hsl(var(--muted-foreground))",
      }));

      // Monthly data for chart (last 6 months)
      const monthlyChartData: Array<{ name: string; vendas: number; despesas: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const { data: mSales } = await supabase
          .from("sales")
          .select("total")
          .eq("status", "completed")
          .gte("created_at", mStart.toISOString())
          .lte("created_at", mEnd.toISOString());
        const monthTotal = (mSales || []).reduce(
          (acc, s) => acc + Number(s.total),
          0
        );
        monthlyChartData.push({
          name: format(monthDate, "MMM").substring(0, 3),
          vendas: monthTotal,
          despesas: Math.round(monthTotal * 0.4), // Placeholder - despesas table would be needed
        });
      }

      setStats({
        salesToday: countToday,
        revenueToday: revToday,
        ticketToday: countToday > 0 ? revToday / countToday : 0,
        paToday: countToday > 0 ? itemsCountToday / countToday : 0,
        salesMonth: countMonth,
        revenueMonth: revMonth,
        ticketMonth: countMonth > 0 ? revMonth / countMonth : 0,
        paMonth: countMonth > 0 ? itemsCountMonth / countMonth : 0,
        revenueLastMonth: revLastMonth,
        lowStockProducts: lowStock,
        expiringProducts: expiring,
        recentSales: recent,
        topProducts: topProds,
        monthlyData: monthlyChartData,
        categoryData: catData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when user changes or store settings change
  useEffect(() => {
    fetchDashboardData();
  }, [user, store?.alertSettings?.lowStockEnabled, store?.alertSettings?.lowStockThreshold, store?.alertSettings?.expiryAlertEnabled, store?.alertSettings?.expiryDaysBefore]);

  // Calculate trends
  const trends = useMemo(() => {
    const revTrend =
      stats.revenueLastMonth > 0
        ? Math.round(
            ((stats.revenueMonth - stats.revenueLastMonth) /
              stats.revenueLastMonth) *
              100
          )
        : stats.revenueMonth > 0
        ? 100
        : 0;
    return {
      revenueTrend: revTrend,
    };
  }, [stats.revenueMonth, stats.revenueLastMonth]);

  return {
    ...stats,
    trends,
    loading,
    refetch: fetchDashboardData,
  };
}
