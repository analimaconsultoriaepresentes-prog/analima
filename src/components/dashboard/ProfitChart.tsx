import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ProfitChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function ProfitChart({ data }: ProfitChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);

  return (
    <div className="bg-card rounded-2xl border border-border/40 p-4 sm:p-6 shadow-md animate-slide-up hover:shadow-lg transition-all duration-300">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Vendas por Categoria</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">Distribuição mensal</p>
      </div>
      <div className="h-[180px] sm:h-[250px]">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Sem dados ainda
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs sm:text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
