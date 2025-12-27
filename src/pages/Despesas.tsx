import { useState } from "react";
import { Plus, Search, Receipt, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  status: "pago" | "pendente";
  type: "fixa" | "variavel";
}

const expenses: Expense[] = [
  { id: "1", description: "Aluguel da loja", category: "Infraestrutura", amount: 2500, dueDate: "2024-01-10", status: "pago", type: "fixa" },
  { id: "2", description: "Conta de luz", category: "Utilidades", amount: 380, dueDate: "2024-01-15", status: "pendente", type: "fixa" },
  { id: "3", description: "Fornecedor ABC Cosméticos", category: "Estoque", amount: 1850, dueDate: "2024-01-20", status: "pendente", type: "variavel" },
  { id: "4", description: "Internet", category: "Utilidades", amount: 120, dueDate: "2024-01-12", status: "pago", type: "fixa" },
  { id: "5", description: "Material de embalagem", category: "Operacional", amount: 450, dueDate: "2024-01-18", status: "pendente", type: "variavel" },
];

export default function Despesas() {
  const [searchTerm, setSearchTerm] = useState("");

  const totalPending = expenses
    .filter(e => e.status === "pendente")
    .reduce((acc, e) => acc + e.amount, 0);

  const totalPaid = expenses
    .filter(e => e.status === "pago")
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground mt-1">Controle seus gastos mensais</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Pagar</p>
              <p className="text-xl font-bold text-warning">R$ {totalPending.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pago</p>
              <p className="text-xl font-bold text-success">R$ {totalPaid.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <Receipt className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total do Mês</p>
              <p className="text-xl font-bold text-foreground">R$ {(totalPending + totalPaid).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar despesas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-styled"
        />
      </div>

      {/* Expenses List */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden animate-slide-up">
        <div className="divide-y divide-border">
          {expenses.map((expense, index) => (
            <div
              key={expense.id}
              className="p-4 hover:bg-muted/30 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    expense.status === "pago" ? "bg-success/10" : "bg-warning/10"
                  )}>
                    {expense.status === "pago" ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Clock className="w-5 h-5 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="alert-badge bg-muted text-muted-foreground">{expense.category}</span>
                      <span className={cn(
                        "alert-badge",
                        expense.type === "fixa" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                      )}>
                        {expense.type === "fixa" ? "Fixa" : "Variável"}
                      </span>
                      <span className="text-sm text-muted-foreground">Vence: {expense.dueDate}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    expense.status === "pago" ? "text-muted-foreground line-through" : "text-destructive"
                  )}>
                    -R$ {expense.amount.toLocaleString('pt-BR')}
                  </p>
                  <span className={cn(
                    "text-sm",
                    expense.status === "pago" ? "text-success" : "text-warning"
                  )}>
                    {expense.status === "pago" ? "Pago" : "Pendente"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
