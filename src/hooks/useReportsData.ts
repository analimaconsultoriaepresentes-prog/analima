import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface ReportStats {
  totalReceita: number;
  totalDespesa: number;
  totalLucro: number;
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
}

export function useReportsData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalReceita: 0,
    totalDespesa: 0,
    totalLucro: 0,
    monthlyData: [],
    categoryData: [],
  });

  const fetchReportData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      const monthlyData: MonthlyData[] = [];
      let totalReceita = 0;
      let totalDespesa = 0;

      // Fetch data for last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);

        // Fetch sales for this month
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

        // Fetch expenses for this month
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

        monthlyData.push({
          name: format(monthDate, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + 
                format(monthDate, "MMM", { locale: ptBR }).slice(1),
          receitas: monthRevenue,
          despesas: monthExpenses,
          lucro: monthRevenue - monthExpenses,
        });
      }

      // Fetch category data from sale_items
      const sixMonthsAgo = subMonths(today, 6);
      const { data: salesData } = await supabase
        .from("sales")
        .select("id, total")
        .eq("status", "completed")
        .gte("created_at", sixMonthsAgo.toISOString());

      const saleIds = (salesData || []).map((s) => s.id);
      
      const { data: saleItemsData } = await supabase
        .from("sale_items")
        .select("product_id, product_name, subtotal")
        .in("sale_id", saleIds.length > 0 ? saleIds : ["none"]);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, category, cost_price, sale_price");

      // Calculate category totals
      const categoryTotals: Record<string, { receita: number; custo: number }> = {};
      
      (saleItemsData || []).forEach((item) => {
        const product = (productsData || []).find((p) => p.id === item.product_id);
        const category = product?.category || "Outros";
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { receita: 0, custo: 0 };
        }
        
        categoryTotals[category].receita += Number(item.subtotal);
        if (product) {
          // Estimate cost based on product cost_price ratio
          const margin = product.sale_price > 0 
            ? ((product.sale_price - product.cost_price) / product.sale_price) * 100 
            : 0;
          categoryTotals[category].custo += Number(item.subtotal) * (1 - margin / 100);
        }
      });

      const categoryData: CategoryData[] = Object.entries(categoryTotals)
        .map(([name, data]) => ({
          name,
          receita: data.receita,
          margem: data.receita > 0 
            ? Math.round(((data.receita - data.custo) / data.receita) * 100) 
            : 0,
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 5);

      setStats({
        totalReceita,
        totalDespesa,
        totalLucro: totalReceita - totalDespesa,
        monthlyData,
        categoryData,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [user]);

  return {
    ...stats,
    loading,
    refetch: fetchReportData,
  };
}
