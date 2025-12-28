import { useState } from "react";
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAccounts, AccountFormData } from "@/hooks/useAccounts";
import { AccountForm } from "@/components/accounts/AccountForm";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  em_dia: "Em dia",
  vencendo: "Vence em breve",
  atrasado: "Atrasado",
  pago: "Pago",
};

const statusColors: Record<string, string> = {
  em_dia: "bg-success/10 text-success",
  vencendo: "bg-warning/10 text-warning",
  atrasado: "bg-destructive/10 text-destructive",
  pago: "bg-muted text-muted-foreground",
};

export default function Contas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pagar" | "receber">("pagar");

  const {
    accounts,
    isLoading,
    createAccount,
    markAsPaid,
    deleteAccount,
    totalPagar,
    totalReceber,
    saldo,
  } = useAccounts();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleCreateAccount = (data: AccountFormData) => {
    createAccount.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const filteredAccounts = accounts.filter((a) =>
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderAccountList = (type: "pagar" | "receber") => {
    const filtered = filteredAccounts.filter((a) => a.account_type === type);
    
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
          {type === "pagar" ? (
            <ArrowDownCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          ) : (
            <ArrowUpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          )}
          <p className="text-muted-foreground">
            {searchTerm 
              ? "Nenhuma conta encontrada" 
              : `Nenhuma conta ${type === "pagar" ? "a pagar" : "a receber"} cadastrada`
            }
          </p>
          {!searchTerm && (
            <Button 
              className="mt-4" 
              onClick={() => setIsFormOpen(true)}
            >
              Adicionar primeira conta
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
            {filtered.map((account, index) => (
              <div
                key={account.id}
                className="p-4 hover:bg-muted/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      account.status === "pago" 
                        ? "bg-muted" 
                        : type === "pagar" 
                          ? "bg-destructive/10" 
                          : "bg-success/10"
                    )}>
                      {account.status === "pago" ? (
                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                      ) : type === "pagar" ? (
                        <ArrowDownCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm text-muted-foreground">{account.person}</span>
                        <span className={cn("alert-badge", statusColors[account.status])}>
                          {statusLabels[account.status]}
                        </span>
                        <span className="text-sm text-muted-foreground">Vence: {formatDate(account.due_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        account.status === "pago" 
                          ? "text-muted-foreground line-through" 
                          : type === "pagar" 
                            ? "text-destructive" 
                            : "text-success"
                      )}>
                        {type === "pagar" ? "-" : "+"}R$ {Number(account.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {account.status !== "pago" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => markAsPaid.mutate(account.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Pagar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAccount.mutate(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile view - cards */}
        <div className="sm:hidden space-y-3">
          {filtered.map((account, index) => (
            <div
              key={account.id}
              className="bg-card rounded-xl border border-border/50 p-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{account.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">{account.person}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={cn("alert-badge text-xs", statusColors[account.status])}>
                      {statusLabels[account.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vence: {formatDate(account.due_date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-lg font-bold",
                    account.status === "pago" 
                      ? "text-muted-foreground line-through" 
                      : type === "pagar" 
                        ? "text-destructive" 
                        : "text-success"
                  )}>
                    {type === "pagar" ? "-" : "+"}R$ {Number(account.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 gap-2">
                {account.status !== "pago" ? (
                  <Button
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => markAsPaid.mutate(account.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como {type === "pagar" ? "Pago" : "Recebido"}
                  </Button>
                ) : (
                  <span className="flex-1 text-sm text-muted-foreground text-center">
                    ✓ {type === "pagar" ? "Pago" : "Recebido"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px]"
                  onClick={() => deleteAccount.mutate(account.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
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
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contas</h1>
            <p className="text-muted-foreground mt-1">Gerencie contas a pagar e receber</p>
          </div>
          <Button 
            className="btn-primary gap-2 min-h-[48px] px-4 sm:px-6 w-full sm:w-auto"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <ArrowDownCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Pagar</p>
              <p className="text-xl font-bold text-destructive">
                R$ {totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <ArrowUpCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Receber</p>
              <p className="text-xl font-bold text-success">
                R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={cn(
                "text-xl font-bold",
                saldo >= 0 ? "text-success" : "text-destructive"
              )}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-styled"
        />
      </div>

      {/* Tabs */}
      <Tabs 
        defaultValue="pagar" 
        className="animate-slide-up"
        onValueChange={(v) => setActiveTab(v as "pagar" | "receber")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pagar" className="gap-2 min-h-[44px]">
            <ArrowDownCircle className="w-4 h-4" />
            A Pagar
          </TabsTrigger>
          <TabsTrigger value="receber" className="gap-2 min-h-[44px]">
            <ArrowUpCircle className="w-4 h-4" />
            A Receber
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pagar" className="mt-4">
          {renderAccountList("pagar")}
        </TabsContent>
        <TabsContent value="receber" className="mt-4">
          {renderAccountList("receber")}
        </TabsContent>
      </Tabs>

      <AccountForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateAccount}
        isLoading={createAccount.isPending}
        defaultType={activeTab}
      />
    </div>
  );
}
