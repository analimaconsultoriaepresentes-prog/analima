import { DollarSign, TrendingUp, Receipt, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { TopProductsCard } from "@/components/dashboard/TopProductsCard";
import { RecentSalesCard } from "@/components/dashboard/RecentSalesCard";
import { ProfitChart } from "@/components/dashboard/ProfitChart";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Olá, Bem-vindo! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Veja como está o desempenho da sua loja hoje
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Hoje"
          value="R$ 1.245,00"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
          className="delay-100"
        />
        <StatCard
          title="Faturamento do Mês"
          value="R$ 28.450,00"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
          variant="success"
          className="delay-200"
        />
        <StatCard
          title="Despesas do Mês"
          value="R$ 12.380,00"
          icon={<Receipt className="w-5 h-5" />}
          trend={{ value: 3, isPositive: false }}
          variant="warning"
          className="delay-300"
        />
        <StatCard
          title="Lucro Estimado"
          value="R$ 16.070,00"
          icon={<Wallet className="w-5 h-5" />}
          trend={{ value: 15, isPositive: true }}
          className="delay-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <ProfitChart />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentSalesCard />
        <TopProductsCard />
        <AlertsCard />
      </div>
    </div>
  );
}
