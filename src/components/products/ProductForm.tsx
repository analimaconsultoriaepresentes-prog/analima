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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product, ProductFormData } from "@/hooks/useProducts";

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

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
  editProduct?: Product | null;
}

function ProductFormContent({ 
  form, 
  onSubmit, 
  onCancel, 
  editProduct 
}: { 
  form: ReturnType<typeof useForm<ProductFormData>>; 
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  editProduct?: Product | null;
}) {
  const costPrice = form.watch("costPrice");
  const salePrice = form.watch("salePrice");
  
  const margin = salePrice > 0 && costPrice > 0 && salePrice > costPrice
    ? ((salePrice - costPrice) / salePrice * 100).toFixed(1)
    : "0.0";
  
  const profit = salePrice > costPrice ? (salePrice - costPrice).toFixed(2) : "0.00";

  function handleSubmit(data: ProductFormData) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-5">
        {/* Nome do Produto */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Perfume Dolce & Gabbana" 
                  className="input-styled min-h-[44px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria e Marca - stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-styled min-h-[44px]">
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
                    className="input-styled min-h-[44px]"
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
                <FormLabel>Custo (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0,00" 
                    className="input-styled min-h-[44px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venda (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0,00" 
                    className="input-styled min-h-[44px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cálculos automáticos */}
        {costPrice > 0 && salePrice > 0 && salePrice > costPrice && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-3 sm:p-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Lucro/unidade</p>
                <p className="font-bold text-success text-base sm:text-lg">R$ {profit}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Margem</p>
                <p className="font-bold text-success text-base sm:text-lg">{margin}%</p>
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
                <FormLabel>Estoque</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    inputMode="numeric"
                    placeholder="0" 
                    className="input-styled min-h-[44px]"
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
                <FormLabel>Validade</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal input-styled min-h-[44px]",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yy", { locale: ptBR })
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botões - sticky bottom on mobile */}
        <div className="flex gap-3 pt-4 sticky bottom-0 bg-card pb-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[48px] text-base"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 btn-primary min-h-[48px] text-base">
            {editProduct ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function ProductForm({ open, onOpenChange, onSubmit, editProduct }: ProductFormProps) {
  const isMobile = useIsMobile();
  
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

  // Reset form when editProduct changes
  useState(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name,
        category: editProduct.category,
        brand: editProduct.brand,
        costPrice: editProduct.costPrice,
        salePrice: editProduct.salePrice,
        stock: editProduct.stock,
        expiryDate: editProduct.expiryDate ? new Date(editProduct.expiryDate) : undefined,
      });
    } else {
      form.reset({
        name: "",
        brand: "",
        costPrice: 0,
        salePrice: 0,
        stock: 0,
      });
    }
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data);
    form.reset();
  };

  const header = (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
        <Package className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-semibold">
        {editProduct ? "Editar Produto" : "Novo Produto"}
      </span>
    </div>
  );

  const description = editProduct 
    ? "Atualize os dados do produto."
    : "Preencha os dados do produto.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{header}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <ProductFormContent 
              form={form} 
              onSubmit={handleSubmit} 
              onCancel={handleClose}
              editProduct={editProduct}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ProductFormContent 
          form={form} 
          onSubmit={handleSubmit} 
          onCancel={handleClose}
          editProduct={editProduct}
        />
      </DialogContent>
    </Dialog>
  );
}
