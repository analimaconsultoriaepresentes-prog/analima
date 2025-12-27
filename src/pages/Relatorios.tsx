import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const monthlyData = [
  { name: "Jan", receitas: 28000, despesas: 12000, lucro: 16000 },
  { name: "Fev", receitas: 25000, despesas: 11000, lucro: 14000 },
  { name: "Mar", receitas: 32000, despesas: 14000, lucro: 18000 },
  { name: "Abr", receitas: 29000, despesas: 13000, lucro: 16000 },
  { name: "Mai", receitas: 35000, despesas: 15000, lucro: 20000 },
  { name: "Jun", receitas: 38000, despesas: 16000, lucro: 22000 },
];

const categoryData = [
  { name: "Perfumes", receita: 45000, margem: 42 },
  { name: "Presentes", receita: 28000, margem: 35 },
  { name: "Cosméticos", receita: 22000, margem: 38 },
];

export default function Relatorios() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise financeira do seu negócio</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total (6 meses)</p>
              <p className="text-xl font-bold text-success">R$ 187.000</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas Total (6 meses)</p>
              <p className="text-xl font-bold text-destructive">R$ 81.000</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lucro Total (6 meses)</p>
              <p className="text-xl font-bold text-primary">R$ 106.000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Receitas vs Despesas</h3>
            <p className="text-sm text-muted-foreground">Comparativo mensal</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Evolução do Lucro</h3>
            <p className="text-sm text-muted-foreground">Tendência mensal</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  name="Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Desempenho por Categoria</h3>
          <p className="text-sm text-muted-foreground">Receita e margem de lucro</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryData.map((category, index) => (
            <div
              key={category.name}
              className="p-4 rounded-lg border border-border/50 bg-muted/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-foreground">{category.name}</span>
                <span className="alert-badge bg-primary/10 text-primary">{category.margem}% margem</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                R$ {category.receita.toLocaleString('pt-BR')}
              </p>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(category.receita / 45000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
