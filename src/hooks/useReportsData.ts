import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { subMonths, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getMonthStartUTC, getMonthEndUTC } from "@/lib/timezone";

export type PeriodOption = "30days" | "3months" | "6months" | "1year";

export const periodLabels: Record<PeriodOption, string> = {
  "30days": "Últimos 30 dias",
  "3months": "Últimos 3 meses",
  "6months": "Últimos 6 meses",
  "1year": "Último 1 ano",
};

interface MonthlyData {
  name: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

interface CategoryData {
  name: string;
  receita: number;
  margem: number;
}

interface ComparisonData {
  current: number;
  previous: number;
  difference: number;
  percentChange: number;
  trend: "up" | "down" | "stable";
}

interface ReportStats {
  totalReceita: number;
  totalDespesa: number;
  totalLucro: number;
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
  comparison: {
    receita: ComparisonData;
    despesa: ComparisonData;
    lucro: ComparisonData;
  };
}

function calculateComparison(current: number, previous: number): ComparisonData {
  const difference = current - previous;
  const percentChange = previous > 0 
    ? ((current - previous) / previous) * 100 
    : current > 0 ? 100 : 0;
  
  let trend: "up" | "down" | "stable" = "stable";
  if (Math.abs(percentChange) > 1) {
    trend = percentChange > 0 ? "up" : "down";
  }
  
  return {
    current,
    previous,
    difference,
    percentChange,
    trend,
  };
}

export function useReportsData(period: PeriodOption = "6months") {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalReceita: 0,
    totalDespesa: 0,
    totalLucro: 0,
    monthlyData: [],
    categoryData: [],
    comparison: {
      receita: { current: 0, previous: 0, difference: 0, percentChange: 0, trend: "stable" },
      despesa: { current: 0, previous: 0, difference: 0, percentChange: 0, trend: "stable" },
      lucro: { current: 0, previous: 0, difference: 0, percentChange: 0, trend: "stable" },
    },
  });

  const getMonthsCount = (p: PeriodOption): number => {
    switch (p) {
      case "30days": return 1;
      case "3months": return 3;
      case "6months": return 6;
      case "1year": return 12;
      default: return 6;
    }
  };

  const getDaysCount = (p: PeriodOption): number => {
    switch (p) {
      case "30days": return 30;
      case "3months": return 90;
      case "6months": return 180;
      case "1year": return 365;
      default: return 180;
    }
  };

  const fetchReportData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date();
      const monthlyData: MonthlyData[] = [];
      let totalReceita = 0;
      let totalDespesa = 0;

      const monthsCount = getMonthsCount(period);
      const daysCount = getDaysCount(period);

      // For 30 days, we still show 1 month of data
      const loopCount = period === "30days" ? 1 : monthsCount;

      for (let i = loopCount - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        let mStart: Date;
        let mEnd: Date;

        if (period === "30days" && i === 0) {
          // For 30 days, use the last 30 days
          mStart = subDays(today, 30);
          mEnd = today;
        } else {
          // Use Brazil timezone for month boundaries
          mStart = getMonthStartUTC(monthDate);
          mEnd = getMonthEndUTC(monthDate);
        }

        // Fetch sales for this period
        const { data: salesData } = await supabase
          .from("sales")
          .select("total")
          .eq("status", "completed")
          .gte("created_at", mStart.toISOString())
          .lte("created_at", mEnd.toISOString());

        const monthRevenue = (salesData || []).reduce(
          (acc, s) => acc + Number(s.total),
          0
        );

        // Fetch expenses for this period
        const { data: expensesData } = await supabase
          .from("expenses")
          .select("amount, status")
          .gte("due_date", format(mStart, "yyyy-MM-dd"))
          .lte("due_date", format(mEnd, "yyyy-MM-dd"));

        const monthExpenses = (expensesData || []).reduce(
          (acc, e) => acc + Number(e.amount),
          0
        );

        totalReceita += monthRevenue;
        totalDespesa += monthExpenses;

        const monthName = period === "30days" 
          ? "30 dias"
          : format(monthDate, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + 
            format(monthDate, "MMM", { locale: ptBR }).slice(1);

        monthlyData.push({
          name: monthName,
          receitas: monthRevenue,
          despesas: monthExpenses,
          lucro: monthRevenue - monthExpenses,
        });
      }

      // ==========================================
      // FETCH PREVIOUS PERIOD DATA FOR COMPARISON
      // ==========================================
      let prevPeriodStart: Date;
      let prevPeriodEnd: Date;

      if (period === "30days") {
        prevPeriodEnd = subDays(today, 31);
        prevPeriodStart = subDays(today, 60);
      } else {
        prevPeriodEnd = subMonths(today, monthsCount);
        prevPeriodStart = subMonths(today, monthsCount * 2);
      }

      // Fetch previous period sales
      const { data: prevSalesData } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("created_at", prevPeriodStart.toISOString())
        .lte("created_at", prevPeriodEnd.toISOString());

      const prevReceita = (prevSalesData || []).reduce(
        (acc, s) => acc + Number(s.total),
        0
      );

      // Fetch previous period expenses
      const { data: prevExpensesData } = await supabase
        .from("expenses")
        .select("amount")
        .gte("due_date", format(prevPeriodStart, "yyyy-MM-dd"))
        .lte("due_date", format(prevPeriodEnd, "yyyy-MM-dd"));

      const prevDespesa = (prevExpensesData || []).reduce(
        (acc, e) => acc + Number(e.amount),
        0
      );

      const prevLucro = prevReceita - prevDespesa;
      const totalLucro = totalReceita - totalDespesa;

      // Calculate comparisons
      const comparison = {
        receita: calculateComparison(totalReceita, prevReceita),
        despesa: calculateComparison(totalDespesa, prevDespesa),
        lucro: calculateComparison(totalLucro, prevLucro),
      };

      // Fetch category data from sale_items
      const periodStart = period === "30days" 
        ? subDays(today, 30) 
        : subMonths(today, monthsCount);

      const { data: salesData } = await supabase
        .from("sales")
        .select("id, total")
        .eq("status", "completed")
        .gte("created_at", periodStart.toISOString());

      const saleIds = (salesData || []).map((s) => s.id);
      
      const { data: saleItemsData } = await supabase
        .from("sale_items")
        .select("product_id, product_name, subtotal, quantity")
        .in("sale_id", saleIds.length > 0 ? saleIds : ["none"]);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, category, cost_price, sale_price, is_basket, product_type");

      // Find average packaging cost from packaging products
      const packagingProducts = (productsData || []).filter(p => p.product_type === 'packaging');
      const avgPackagingCost = packagingProducts.length > 0
        ? packagingProducts.reduce((acc, p) => acc + Number(p.cost_price), 0) / packagingProducts.length
        : 0;

      // Calculate category totals with real cost including packaging
      const categoryTotals: Record<string, { receita: number; custo: number }> = {};
      
      (saleItemsData || []).forEach((item) => {
        const product = (productsData || []).find((p) => p.id === item.product_id);
        const category = product?.category || "Outros";
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { receita: 0, custo: 0 };
        }
        
        categoryTotals[category].receita += Number(item.subtotal);
        if (product) {
          // Custo do produto
          const productCost = Number(product.cost_price) * item.quantity;
          
          // Custo de embalagem: apenas para itens avulsos (não cestas)
          // Cestas já têm embalagem inclusa no cost_price
          const packagingCost = product.is_basket ? 0 : avgPackagingCost * item.quantity;
          
          categoryTotals[category].custo += productCost + packagingCost;
        }
      });

      const categoryData: CategoryData[] = Object.entries(categoryTotals)
        .map(([name, data]) => ({
          name,
          receita: data.receita,
          // Margem real = (receita - custo total) / receita * 100
          margem: data.receita > 0 
            ? Math.round(((data.receita - data.custo) / data.receita) * 100) 
            : 0,
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 5);

      setStats({
        totalReceita,
        totalDespesa,
        totalLucro,
        monthlyData,
        categoryData,
        comparison,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [user, period]);

  return {
    ...stats,
    loading,
    refetch: fetchReportData,
    period,
  };
}