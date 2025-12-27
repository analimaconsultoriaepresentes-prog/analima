import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  category: z.enum(["Presente", "Perfume", "Cosmético"], {
    required_error: "Selecione uma categoria",
  }),
  brand: z.string().min(1, "Informe a marca").max(50, "Marca muito longa"),
  costPrice: z.coerce.number().min(0.01, "Preço de custo deve ser maior que zero"),
  salePrice: z.coerce.number().min(0.01, "Preço de venda deve ser maior que zero"),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  expiryDate: z.date().optional(),
}).refine((data) => data.salePrice > data.costPrice, {
  message: "Preço de venda deve ser maior que o preço de custo",
  path: ["salePrice"],
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
}

export function ProductForm({ open, onOpenChange, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      costPrice: 0,
      salePrice: 0,
      stock: 0,
    },
  });

  const costPrice = form.watch("costPrice");
  const salePrice = form.watch("salePrice");
  
  const margin = salePrice > 0 && costPrice > 0 && salePrice > costPrice
    ? ((salePrice - costPrice) / salePrice * 100).toFixed(1)
    : "0.0";
  
  const profit = salePrice > costPrice ? (salePrice - costPrice).toFixed(2) : "0.00";

  function handleSubmit(data: ProductFormData) {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
    toast({
      title: "Produto cadastrado!",
      description: `${data.name} foi adicionado ao seu catálogo.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            Novo Produto
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do produto para adicionar ao catálogo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Nome do Produto */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Perfume Dolce & Gabbana Light Blue" 
                      className="input-styled"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria e Marca */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-styled">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Presente">Presente</SelectItem>
                        <SelectItem value="Perfume">Perfume</SelectItem>
                        <SelectItem value="Cosmético">Cosmético</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: D&G" 
                        className="input-styled"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0,00" 
                        className="input-styled"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Quanto você pagou
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0,00" 
                        className="input-styled"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Quanto vai vender
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cálculos automáticos */}
            {costPrice > 0 && salePrice > 0 && salePrice > costPrice && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Lucro por unidade</p>
                    <p className="font-bold text-success text-lg">R$ {profit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Margem de lucro</p>
                    <p className="font-bold text-success text-lg">{margin}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Estoque e Validade */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em Estoque</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0" 
                        className="input-styled"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Validade</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal input-styled",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Opcional</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">
                      Se aplicável
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 btn-primary">
                Cadastrar Produto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export type { ProductFormData };
