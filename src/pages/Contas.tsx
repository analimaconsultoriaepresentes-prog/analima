import { useState } from "react";
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  description: string;
  person: string;
  amount: number;
  dueDate: string;
  status: "em_dia" | "vencendo" | "atrasado";
  type: "pagar" | "receber";
}

const accounts: Account[] = [
  { id: "1", description: "Fornecedor XYZ", person: "XYZ Cosméticos", amount: 3200, dueDate: "2024-01-25", status: "em_dia", type: "pagar" },
  { id: "2", description: "Cliente Maria", person: "Maria Silva", amount: 450, dueDate: "2024-01-16", status: "vencendo", type: "receber" },
  { id: "3", description: "Distribuidora ABC", person: "ABC Perfumes", amount: 1800, dueDate: "2024-01-10", status: "atrasado", type: "pagar" },
  { id: "4", description: "Venda fiado - João", person: "João Santos", amount: 280, dueDate: "2024-01-20", status: "em_dia", type: "receber" },
  { id: "5", description: "Fornecedor Premium", person: "Premium Gifts", amount: 2500, dueDate: "2024-01-30", status: "em_dia", type: "pagar" },
];

const statusLabels: Record<string, string> = {
  em_dia: "Em dia",
  vencendo: "Vence em breve",
  atrasado: "Atrasado",
};

const statusColors: Record<string, string> = {
  em_dia: "bg-success/10 text-success",
  vencendo: "bg-warning/10 text-warning",
  atrasado: "bg-destructive/10 text-destructive",
};

export default function Contas() {
  const [searchTerm, setSearchTerm] = useState("");

  const totalPagar = accounts.filter(a => a.type === "pagar").reduce((acc, a) => acc + a.amount, 0);
  const totalReceber = accounts.filter(a => a.type === "receber").reduce((acc, a) => acc + a.amount, 0);

  const renderAccountList = (type: "pagar" | "receber") => {
    const filtered = accounts.filter(a => a.type === type);
    
    return (
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
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
                    type === "pagar" ? "bg-destructive/10" : "bg-success/10"
                  )}>
                    {type === "pagar" ? (
                      <ArrowDownCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{account.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{account.person}</span>
                      <span className={cn("alert-badge", statusColors[account.status])}>
                        {statusLabels[account.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    type === "pagar" ? "text-destructive" : "text-success"
                  )}>
                    {type === "pagar" ? "-" : "+"}R$ {account.amount.toLocaleString('pt-BR')}
                  </p>
                  <span className="text-sm text-muted-foreground">Vence: {account.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground mt-1">Gerencie contas a pagar e receber</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nova Conta
        </Button>
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
              <p className="text-xl font-bold text-destructive">R$ {totalPagar.toLocaleString('pt-BR')}</p>
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
              <p className="text-xl font-bold text-success">R$ {totalReceber.toLocaleString('pt-BR')}</p>
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
                totalReceber - totalPagar >= 0 ? "text-success" : "text-destructive"
              )}>
                R$ {(totalReceber - totalPagar).toLocaleString('pt-BR')}
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
      <Tabs defaultValue="pagar" className="animate-slide-up">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pagar" className="gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            A Pagar
          </TabsTrigger>
          <TabsTrigger value="receber" className="gap-2">
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
    </div>
  );
}
