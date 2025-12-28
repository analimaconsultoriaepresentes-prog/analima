import { DollarSign, TrendingUp, Receipt, Package, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { TopProductsCard } from "@/components/dashboard/TopProductsCard";
import { RecentSalesCard } from "@/components/dashboard/RecentSalesCard";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const {
    revenueToday,
    revenueMonth,
    ticketMonth,
    paMonth,
    trends,
    lowStockProducts,
    expiringProducts,
    recentSales,
    topProducts,
    monthlyData,
    categoryData,
    loading,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Olá, Bem-vindo! 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Veja como está o desempenho da sua loja hoje
        </p>
      </div>

      {/* Stats Grid - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Faturamento Hoje"
          value={`R$ ${revenueToday.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="primary"
          className="delay-100"
        />
        <StatCard
          title="Faturamento do Mês"
          value={`R$ ${revenueMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={
            trends.revenueTrend !== 0
              ? { value: Math.abs(trends.revenueTrend), isPositive: trends.revenueTrend > 0 }
              : undefined
          }
          variant="success"
          className="delay-200"
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${ticketMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Receipt className="w-5 h-5" />}
          variant="warning"
          className="delay-300"
        />
        <StatCard
          title="PA (Itens/Venda)"
          value={paMonth.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          icon={<Package className="w-5 h-5" />}
          className="delay-400"
        />
      </div>

      {/* Charts Row - stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={monthlyData} />
        </div>
        <div>
          <ProfitChart data={categoryData} />
        </div>
      </div>

      {/* Bottom Grid - stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <RecentSalesCard sales={recentSales} />
        <TopProductsCard products={topProducts} />
        <AlertsCard lowStock={lowStockProducts} expiring={expiringProducts} />
      </div>
    </div>
  );
}
