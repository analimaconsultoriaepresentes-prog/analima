import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Customer, CustomerSaleHistory } from "@/hooks/useCustomers";
import {
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  ShoppingBag,
  Loader2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  getSalesHistory: (customerId: string) => Promise<CustomerSaleHistory[]>;
}

function CustomerDetailsContent({
  customer,
  getSalesHistory,
  onClose,
}: {
  customer: Customer | null;
  getSalesHistory: (customerId: string) => Promise<CustomerSaleHistory[]>;
  onClose: () => void;
}) {
  const [salesHistory, setSalesHistory] = useState<CustomerSaleHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setLoading(true);
      getSalesHistory(customer.id).then((history) => {
        setSalesHistory(history);
        setLoading(false);
      });
    }
  }, [customer, getSalesHistory]);

  if (!customer) return null;

  const totalSpent = salesHistory
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.total, 0);

  const formatBirthday = (date: string) => {
    const [year, month, day] = date.split("-");
    return `${day}/${month}`;
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Customer Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">
              Cliente desde {format(new Date(customer.createdAt), "MMM yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          {customer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.birthday && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Aniversário: {formatBirthday(customer.birthday)}</span>
            </div>
          )}
          {customer.notes && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <FileText className="w-4 h-4 mt-0.5" />
              <span>{customer.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-2xl font-bold text-primary">
            {salesHistory.filter((s) => s.status === "completed").length}
          </p>
          <p className="text-xs text-muted-foreground">Compras</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-2xl font-bold text-primary">
            R$ {totalSpent.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Total gasto</p>
        </div>
      </div>

      {/* Sales History */}
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Histórico de Compras
        </h4>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : salesHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma compra registrada.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {salesHistory.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(sale.date), "dd/MM/yyyy HH:mm")}
                  </p>
                  <Badge
                    variant={sale.status === "completed" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {sale.status === "completed" ? "Concluída" : "Cancelada"}
                  </Badge>
                </div>
                <p className="font-semibold">R$ {sale.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">
        Fechar
      </Button>
    </div>
  );
}

export function CustomerDetails({
  open,
  onOpenChange,
  customer,
  getSalesHistory,
}: CustomerDetailsProps) {
  const isMobile = useIsMobile();

  const handleClose = () => {
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Detalhes do Cliente
            </DrawerTitle>
          </DrawerHeader>
          <CustomerDetailsContent
            customer={customer}
            getSalesHistory={getSalesHistory}
            onClose={handleClose}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes do Cliente
          </DialogTitle>
        </DialogHeader>
        <CustomerDetailsContent
          customer={customer}
          getSalesHistory={getSalesHistory}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
