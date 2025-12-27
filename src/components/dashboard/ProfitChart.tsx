import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Perfumes", value: 45, color: "hsl(var(--primary))" },
  { name: "Presentes", value: 30, color: "hsl(var(--accent))" },
  { name: "Cosméticos", value: 25, color: "hsl(var(--success))" },
];

export function ProfitChart() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Lucro por Categoria</h3>
        <p className="text-sm text-muted-foreground">Distribuição mensal</p>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
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
              }}
              formatter={(value: number) => [`${value}%`, '']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
