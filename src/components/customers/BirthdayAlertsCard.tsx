import { useMemo } from "react";
import { format, isSameDay, addDays, parseISO, isAfter, isBefore, getMonth, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cake, MessageCircle, Phone, AlertCircle, CalendarDays } from "lucide-react";
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
  dayOfMonth: number;
}

export function BirthdayAlertsCard({ customers, birthdayMessage }: BirthdayAlertsCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentMonth = getMonth(today);
  const nextWeek = addDays(today, 7);

  // Process all customers with birthdays
  const allBirthdayCustomers = useMemo(() => {
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
        
        const isToday = isSameDay(birthdayThisYear, today);
        const timeDiff = birthdayThisYear.getTime() - today.getTime();
        const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        result.push({
          ...customer,
          birthdayThisYear,
          isToday,
          daysUntil: isToday ? 0 : daysUntil,
          dayOfMonth: getDate(birthdayDate),
        });
      } catch (e) {
        console.error("Error parsing birthday:", e);
      }
    });
    
    return result;
  }, [customers, today]);

  // Filter for today and upcoming 7 days
  const todayBirthdays = useMemo(() => 
    allBirthdayCustomers.filter((c) => c.isToday),
  [allBirthdayCustomers]);

  const upcomingBirthdays = useMemo(() => 
    allBirthdayCustomers
      .filter((c) => !c.isToday && isAfter(c.birthdayThisYear, today) && isBefore(c.birthdayThisYear, nextWeek))
      .sort((a, b) => a.daysUntil - b.daysUntil),
  [allBirthdayCustomers, today, nextWeek]);

  // Filter for current month (excluding today's birthdays to avoid duplication)
  const monthBirthdays = useMemo(() => 
    allBirthdayCustomers
      .filter((c) => getMonth(c.birthdayThisYear) === currentMonth && !c.isToday)
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth),
  [allBirthdayCustomers, currentMonth]);

  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (!digits.startsWith("55")) {
      return `55${digits}`;
    }
    return digits;
  };

  const getBirthdayMessage = (customer: BirthdayCustomer): string => {
    const firstName = customer.name.split(" ")[0] || customer.name;
    // Keep as plain UTF-8 string; no encoding/decoding here.
    return birthdayMessage.replace("{NOME}", firstName);
  };

  const getWhatsAppUrl = (customer: BirthdayCustomer): string => {
    const normalizedPhone = normalizePhone(customer.phone || "");
    const message = getBirthdayMessage(customer);

    // Encode ONLY at URL creation time via URLSearchParams.
    const params = new URLSearchParams();
    params.set("text", message);

    return `https://wa.me/${normalizedPhone}?${params.toString()}`;
  };

  const currentMonthName = format(today, "MMMM", { locale: ptBR });

  // Show card if there are any birthdays (today, upcoming, or this month)
  const hasBirthdays = todayBirthdays.length > 0 || upcomingBirthdays.length > 0 || monthBirthdays.length > 0;

  if (!hasBirthdays) {
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
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">🎉 Hoje</p>
            <div className="space-y-2">
              {todayBirthdays.map((customer) => (
                <BirthdayItem
                  key={customer.id}
                  customer={customer}
                  previewMessage={getBirthdayMessage(customer)}
                  whatsappUrl={getWhatsAppUrl(customer)}
                  highlight
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming 7 days */}
        {upcomingBirthdays.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximos 7 dias</p>
            <div className="space-y-2">
              {upcomingBirthdays.map((customer) => (
                <BirthdayItem
                  key={customer.id}
                  customer={customer}
                  previewMessage={getBirthdayMessage(customer)}
                  whatsappUrl={getWhatsAppUrl(customer)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Month birthdays */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            🎂 Aniversariantes de {currentMonthName}
          </p>
          {monthBirthdays.length > 0 ? (
            <div className="space-y-2">
              {monthBirthdays.map((customer) => (
                <BirthdayItem
                  key={customer.id}
                  customer={customer}
                  previewMessage={getBirthdayMessage(customer)}
                  whatsappUrl={getWhatsAppUrl(customer)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3 text-center">Nenhum aniversariante neste mês.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BirthdayItem({
  customer,
  previewMessage,
  whatsappUrl,
  highlight = false,
}: {
  customer: BirthdayCustomer;
  previewMessage: string;
  whatsappUrl: string;
  highlight?: boolean;
}) {
  const formattedDate = format(customer.birthdayThisYear, "dd 'de' MMMM", {
    locale: ptBR,
  });

  const hasValidPhone = !!customer.phone && customer.phone.replace(/\D/g, "").length >= 10;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3 rounded-lg border sm:flex-row sm:items-center sm:justify-between",
        highlight ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", highlight && "text-primary")}>{customer.name}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
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

        {/* Debug: preview of the final (plain) message before opening WhatsApp */}
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer select-none">Preview da mensagem</summary>
          <div className="mt-2 rounded-md border border-border/50 bg-background/50 p-2 text-xs text-foreground whitespace-pre-wrap break-words">
            {previewMessage}
          </div>
        </details>
      </div>

      {hasValidPhone ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            console.log("[WhatsApp] mensagem final:", previewMessage);
            console.log("[WhatsApp] url:", whatsappUrl);
          }}
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 shrink-0 rounded-md text-sm font-medium h-10 px-3 transition-colors sm:w-auto",
            highlight
              ? "bg-green-600 text-white hover:bg-green-700"
              : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="sm:inline">WhatsApp</span>
        </a>
      ) : (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-end">
          <AlertCircle className="w-3 h-3" />
          <span className="sm:inline">Sem WhatsApp</span>
        </div>
      )}
    </div>
  );
}
