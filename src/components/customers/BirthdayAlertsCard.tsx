import { useMemo } from "react";
import { format, isSameDay, addDays, parseISO, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cake, MessageCircle, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Customer } from "@/hooks/useCustomers";

interface BirthdayAlertsCardProps {
  customers: Customer[];
  birthdayMessage: string;
}

interface BirthdayCustomer extends Customer {
  birthdayThisYear: Date;
  isToday: boolean;
  daysUntil: number;
}

export function BirthdayAlertsCard({ customers, birthdayMessage }: BirthdayAlertsCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextWeek = addDays(today, 7);

  const birthdayCustomers = useMemo(() => {
    const result: BirthdayCustomer[] = [];
    
    customers.forEach((customer) => {
      if (!customer.birthday) return;
      
      try {
        const birthdayDate = parseISO(customer.birthday);
        const birthdayThisYear = new Date(
          today.getFullYear(),
          birthdayDate.getMonth(),
          birthdayDate.getDate()
        );
        
        // If birthday already passed this year, consider next year for sorting
        // But we only show the next 7 days, so we focus on upcoming dates
        const isToday = isSameDay(birthdayThisYear, today);
        const isUpcoming = isAfter(birthdayThisYear, today) && isBefore(birthdayThisYear, nextWeek);
        
        if (isToday || isUpcoming) {
          const timeDiff = birthdayThisYear.getTime() - today.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          result.push({
            ...customer,
            birthdayThisYear,
            isToday,
            daysUntil: isToday ? 0 : daysUntil,
          });
        }
      } catch (e) {
        console.error("Error parsing birthday:", e);
      }
    });
    
    // Sort by days until birthday
    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [customers, today, nextWeek]);

  const todayBirthdays = birthdayCustomers.filter((c) => c.isToday);
  const upcomingBirthdays = birthdayCustomers.filter((c) => !c.isToday);

  const formatPhone = (phone: string) => {
    // Remove all non-digits
    return phone.replace(/\D/g, "");
  };

  const handleWhatsApp = (customer: BirthdayCustomer) => {
    if (!customer.phone) return;
    
    const phone = formatPhone(customer.phone);
    const message = birthdayMessage.replace("{NOME}", customer.name.split(" ")[0]);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/55${phone}?text=${encodedMessage}`;
    
    window.open(url, "_blank");
  };

  if (birthdayCustomers.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cake className="w-4 h-4 text-primary" />
          </div>
          Aniversários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's birthdays */}
        {todayBirthdays.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              🎉 Hoje
            </p>
            <div className="space-y-2">
              {todayBirthdays.map((customer) => (
                <BirthdayItem
                  key={customer.id}
                  customer={customer}
                  birthdayMessage={birthdayMessage}
                  onWhatsApp={handleWhatsApp}
                  highlight
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Próximos 7 dias
            </p>
            <div className="space-y-2">
              {upcomingBirthdays.map((customer) => (
                <BirthdayItem
                  key={customer.id}
                  customer={customer}
                  birthdayMessage={birthdayMessage}
                  onWhatsApp={handleWhatsApp}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BirthdayItem({
  customer,
  onWhatsApp,
  highlight = false,
}: {
  customer: BirthdayCustomer;
  birthdayMessage: string;
  onWhatsApp: (customer: BirthdayCustomer) => void;
  highlight?: boolean;
}) {
  const formattedDate = format(customer.birthdayThisYear, "dd 'de' MMMM", {
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        highlight
          ? "bg-primary/10 border-primary/30"
          : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", highlight && "text-primary")}>
          {customer.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{formattedDate}</span>
          {customer.phone && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {customer.phone}
              </span>
            </>
          )}
        </div>
      </div>
      
      {customer.phone ? (
        <Button
          size="sm"
          variant={highlight ? "default" : "outline"}
          className={cn("gap-1.5 shrink-0", highlight && "bg-success hover:bg-success/90")}
          onClick={() => onWhatsApp(customer)}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      ) : (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span className="hidden sm:inline">Sem WhatsApp</span>
        </div>
      )}
    </div>
  );
}