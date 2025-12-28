import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, RefreshCw } from "lucide-react";
import { ExpenseFormData } from "@/hooks/useExpenses";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(100),
  category: z.string().min(1, "Categoria é obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  status: z.enum(["pago", "pendente"]),
  expense_type: z.enum(["fixa", "variavel"]),
  is_recurring: z.boolean().default(false),
  recurring_day: z.coerce.number().min(1).max(31).optional().nullable(),
  recurring_start_date: z.string().optional().nullable(),
  recurring_end_date: z.string().optional().nullable(),
});

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ExpenseFormData>;
}

const categories = [
  "Infraestrutura",
  "Utilidades",
  "Estoque",
  "Operacional",
  "Marketing",
  "Salários",
  "Impostos",
  "Outros",
];

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
}: ExpenseFormProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
      category: initialData?.category || "",
      amount: initialData?.amount || 0,
      due_date: initialData?.due_date || new Date().toISOString().split("T")[0],
      status: initialData?.status || "pendente",
      expense_type: initialData?.expense_type || "variavel",
      is_recurring: initialData?.is_recurring || false,
      recurring_day: initialData?.recurring_day || null,
      recurring_start_date: initialData?.recurring_start_date || new Date().toISOString().split("T")[0],
      recurring_end_date: initialData?.recurring_end_date || null,
    },
  });

  const isRecurring = form.watch("is_recurring");

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      form.reset({
        description: initialData?.description || "",
        category: initialData?.category || "",
        amount: initialData?.amount || 0,
        due_date: initialData?.due_date || new Date().toISOString().split("T")[0],
        status: initialData?.status || "pendente",
        expense_type: initialData?.expense_type || "variavel",
        is_recurring: initialData?.is_recurring || false,
        recurring_day: initialData?.recurring_day || null,
        recurring_start_date: initialData?.recurring_start_date || new Date().toISOString().split("T")[0],
        recurring_end_date: initialData?.recurring_end_date || null,
      });
    }
  }, [open, initialData]);

  const handleSubmit = (data: ExpenseFormData) => {
    // If not recurring, clear recurring fields
    if (!data.is_recurring) {
      data.recurring_day = null;
      data.recurring_start_date = null;
      data.recurring_end_date = null;
    }
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aluguel da loja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expense_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixa">Fixa</SelectItem>
                      <SelectItem value="variavel">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring expense section */}
            <div className="border-t border-border pt-4">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-primary" />
                        Despesa Recorrente
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Repete automaticamente todo mês
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <div className="space-y-4 mt-4 p-3 bg-muted/50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="recurring_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia do Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Ex: 10"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Dia do mês para vencimento (1-31)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurring_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value ?? ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurring_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value ?? ""} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Deixe vazio para recorrência sem fim
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="min-h-[44px]">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar" : "Criar Despesa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}