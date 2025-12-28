import { useState } from "react";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useReportsData, PeriodOption, periodLabels } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Relatorios() {
  const [period, setPeriod] = useState<PeriodOption>("6months");
  const { totalReceita, totalDespesa, totalLucro, monthlyData, categoryData, loading } = useReportsData(period);

  const handleExport = () => {
    if (monthlyData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const sep = ";";
    const lines: string[] = [];

    // SEÇÃO 1 - Evolução Mensal
    lines.push(`EVOLUÇÃO MENSAL (${periodLabels[period]})`);
    lines.push(["Mês", "Receita", "Despesa", "Lucro"].join(sep));
    monthlyData.forEach((m) => {
      lines.push([
        m.name,
        m.receitas.toFixed(2).replace(".", ","),
        m.despesas.toFixed(2).replace(".", ","),
        m.lucro.toFixed(2).replace(".", ","),
      ].join(sep));
    });

    lines.push("");

    // SEÇÃO 2 - Margem por Categoria
    lines.push("MARGEM POR CATEGORIA");
    lines.push(["Categoria", "Receita", "Margem (%)"].join(sep));
    categoryData.forEach((c) => {
      lines.push([
        c.name,
        c.receita.toFixed(2).replace(".", ","),
        c.margem.toString(),
      ].join(sep));
    });

    lines.push("");

    // SEÇÃO 3 - Resumo
    lines.push(`RESUMO (${periodLabels[period]})`);
    lines.push(["Indicador", "Valor"].join(sep));
    lines.push(["Total Receitas", totalReceita.toFixed(2).replace(".", ",")].join(sep));
    lines.push(["Total Despesas", totalDespesa.toFixed(2).replace(".", ",")].join(sep));
    lines.push(["Lucro Total", totalLucro.toFixed(2).replace(".", ",")].join(sep));

    const csv = lines.join("\r\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Relatório exportado com sucesso!");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Análise financeira do seu negócio</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Análise financeira do seu negócio</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
              <SelectTrigger className="min-h-[48px] w-full sm:w-[180px] gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">{periodLabels["30days"]}</SelectItem>
                <SelectItem value="3months">{periodLabels["3months"]}</SelectItem>
                <SelectItem value="6months">{periodLabels["6months"]}</SelectItem>
                <SelectItem value="1year">{periodLabels["1year"]}</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="gap-2 min-h-[48px] w-full sm:w-auto"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Receita Total ({periodLabels[period]})</p>
              <p className="text-xl font-bold text-success truncate">
                R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Despesas Total ({periodLabels[period]})</p>
              <p className="text-xl font-bold text-destructive truncate">
                R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Lucro Total ({periodLabels[period]})</p>
              <p className="text-xl font-bold text-primary truncate">
                R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm animate-slide-up">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-foreground">Receitas vs Despesas</h3>
            <p className="text-sm text-muted-foreground">Comparativo mensal</p>
          </div>
          <div className="h-[250px] sm:h-[300px] -ml-2 sm:ml-0">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10} 
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm animate-slide-up">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-foreground">Evolução do Lucro</h3>
            <p className="text-sm text-muted-foreground">Tendência mensal</p>
          </div>
          <div className="h-[250px] sm:h-[300px] -ml-2 sm:ml-0">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10} 
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    name="Lucro"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm animate-slide-up">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-foreground">Desempenho por Categoria</h3>
          <p className="text-sm text-muted-foreground">Receita e margem de lucro</p>
        </div>
        {categoryData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryData.map((category, index) => (
              <div
                key={category.name}
                className="p-4 rounded-lg border border-border/50 bg-muted/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="font-medium text-foreground truncate">{category.name}</span>
                  <span className="alert-badge bg-primary/10 text-primary shrink-0">{category.margem}% margem</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  R$ {category.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((category.receita / (categoryData[0]?.receita || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma venda registrada no período selecionado
          </div>
        )}
      </div>
    </div>
  );
}
