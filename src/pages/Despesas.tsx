import { useState } from "react";
import { Plus, Search, Receipt, CheckCircle, Clock, Trash2, RefreshCw, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useExpenses, ExpenseFormData } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Despesas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("todas");

  const {
    expenses,
    recurringTemplates,
    isLoading,
    createExpense,
    toggleExpenseStatus,
    deleteExpense,
    stopRecurring,
    totalPending,
    totalPaid,
    totalMonth,
  } = useExpenses();

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecurring = recurringTemplates.filter((expense) =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateExpense = (data: ExpenseFormData) => {
    createExpense.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      // Parse date string as local date to avoid timezone issues
      // Input format: "YYYY-MM-DD"
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const renderExpenseList = (expenseList: typeof expenses, isRecurringList = false) => {
    if (expenseList.length === 0) {
      return (
        <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm 
              ? "Nenhuma despesa encontrada" 
              : isRecurringList 
                ? "Nenhuma despesa recorrente cadastrada" 
                : "Nenhuma despesa cadastrada"
            }
          </p>
          {!searchTerm && (
            <Button 
              className="mt-4" 
              onClick={() => setIsFormOpen(true)}
            >
              {isRecurringList ? "Criar despesa recorrente" : "Adicionar primeira despesa"}
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Desktop view */}
        <div className="hidden sm:block bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="divide-y divide-border">
            {expenseList.map((expense, index) => (
              <div
                key={expense.id}
                className="p-4 hover:bg-muted/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isRecurringList ? (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                        <RefreshCw className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleExpenseStatus.mutate({ 
                          id: expense.id, 
                          currentStatus: expense.status 
                        })}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:opacity-80",
                          expense.status === "pago" ? "bg-success/10" : "bg-warning/10"
                        )}
                        title={expense.status === "pago" ? "Marcar como pendente" : "Marcar como pago"}
                      >
                        {expense.status === "pago" ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <Clock className="w-5 h-5 text-warning" />
                        )}
                      </button>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{expense.description}</p>
                        {expense.is_recurring && (
                          <span className="alert-badge bg-primary/10 text-primary text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Recorrente
                          </span>
                        )}
                        {expense.parent_expense_id && (
                          <span className="alert-badge bg-muted text-muted-foreground text-xs">
                            Gerada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="alert-badge bg-muted text-muted-foreground">{expense.category}</span>
                        <span className={cn(
                          "alert-badge",
                          expense.expense_type === "fixa" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        )}>
                          {expense.expense_type === "fixa" ? "Fixa" : "Variável"}
                        </span>
                        {isRecurringList ? (
                          <span className="text-sm text-muted-foreground">
                            Todo dia {expense.recurring_day || 1}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Vence: {formatDate(expense.due_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        isRecurringList 
                          ? "text-foreground"
                          : expense.status === "pago" 
                            ? "text-muted-foreground line-through" 
                            : "text-destructive"
                      )}>
                        R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {!isRecurringList && (
                        <span className={cn(
                          "text-sm",
                          expense.status === "pago" ? "text-success" : "text-warning"
                        )}>
                          {expense.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      )}
                      {isRecurringList && expense.recurring_end_date && (
                        <span className="text-sm text-muted-foreground">
                          Até {formatDate(expense.recurring_end_date)}
                        </span>
                      )}
                    </div>
                    {isRecurringList ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-warning"
                          >
                            <StopCircle className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Encerrar recorrência?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá parar de gerar novas despesas automaticamente. 
                              As despesas já criadas não serão afetadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => stopRecurring.mutate(expense.id)}
                            >
                              Encerrar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteExpense.mutate(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile view - cards */}
        <div className="sm:hidden space-y-3">
          {expenseList.map((expense, index) => (
            <div
              key={expense.id}
              className="bg-card rounded-xl border border-border/50 p-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">{expense.description}</p>
                    {expense.is_recurring && (
                      <span className="alert-badge bg-primary/10 text-primary text-xs shrink-0">
                        <RefreshCw className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="alert-badge bg-muted text-muted-foreground text-xs">{expense.category}</span>
                    <span className={cn(
                      "alert-badge text-xs",
                      expense.expense_type === "fixa" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    )}>
                      {expense.expense_type === "fixa" ? "Fixa" : "Variável"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isRecurringList 
                      ? `Todo dia ${expense.recurring_day || 1}` 
                      : `Vence: ${formatDate(expense.due_date)}`
                    }
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-lg font-bold",
                    isRecurringList
                      ? "text-foreground"
                      : expense.status === "pago" 
                        ? "text-muted-foreground line-through" 
                        : "text-destructive"
                  )}>
                    R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 gap-2">
                {isRecurringList ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-h-[44px]"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Encerrar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Encerrar recorrência?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso irá parar de gerar novas despesas automaticamente. 
                          As despesas já criadas não serão afetadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => stopRecurring.mutate(expense.id)}
                        >
                          Encerrar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant={expense.status === "pago" ? "outline" : "default"}
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => toggleExpenseStatus.mutate({ 
                      id: expense.id, 
                      currentStatus: expense.status 
                    })}
                  >
                    {expense.status === "pago" ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Pendente
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar Pago
                      </>
                    )}
                  </Button>
                )}
                {!isRecurringList && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px]"
                    onClick={() => deleteExpense.mutate(expense.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground mt-1">Controle seus gastos mensais</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setIsFormOpen(true)}>
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
              <p className="text-xl font-bold text-warning">
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
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
              <p className="text-xl font-bold text-success">
                R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
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
              <p className="text-xl font-bold text-foreground">
                R$ {totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
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

      {/* Tabs for expenses */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="todas" className="min-h-[44px]">
            Todas ({filteredExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="recorrentes" className="min-h-[44px]">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recorrentes ({filteredRecurring.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="todas">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            renderExpenseList(filteredExpenses)
          )}
        </TabsContent>
        
        <TabsContent value="recorrentes">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            renderExpenseList(filteredRecurring, true)
          )}
        </TabsContent>
      </Tabs>

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateExpense}
        isLoading={createExpense.isPending}
      />
    </div>
  );
}