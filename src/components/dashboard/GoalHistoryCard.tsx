import { Trophy, Target, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayGoalData {
  date: Date;
  total: number;
  goal: number;
  achieved: boolean;
}

interface GoalHistoryCardProps {
  data: DayGoalData[];
  dailyGoal: number;
}

export function GoalHistoryCard({ data, dailyGoal }: GoalHistoryCardProps) {
  if (dailyGoal <= 0) {
    return null; // Don't show if no goal is set
  }

  const achievedCount = data.filter(d => d.achieved).length;
  const currentStreak = calculateStreak(data);

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Histórico de Metas
          </CardTitle>
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"} seguido{currentStreak === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Últimos 7 dias</span>
          <span className="font-medium text-foreground">
            {achievedCount}/7 metas batidas
          </span>
        </div>

        {/* Day indicators */}
        <div className="flex gap-1 sm:gap-2 justify-between">
          {data.map((day, index) => {
            const isToday = index === data.length - 1;
            const percentage = day.goal > 0 ? (day.total / day.goal) * 100 : 0;
            
            return (
              <div
                key={day.date.toISOString()}
                className="flex flex-col items-center gap-1 flex-1"
              >
                {/* Day name */}
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">
                  {format(day.date, "EEE", { locale: ptBR }).slice(0, 3)}
                </span>
                
                {/* Indicator */}
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    day.achieved
                      ? "bg-success text-success-foreground shadow-md"
                      : isToday
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : day.total > 0
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted/50 text-muted-foreground/50"
                  )}
                  title={`${format(day.date, "dd/MM")}: R$ ${day.total.toFixed(2)} / R$ ${day.goal.toFixed(2)}`}
                >
                  {day.achieved ? (
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : isToday ? (
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <span className="text-[10px] font-medium">
                      {percentage > 0 ? `${Math.round(percentage)}%` : "-"}
                    </span>
                  )}
                </div>
                
                {/* Date number */}
                <span className={cn(
                  "text-[10px] sm:text-xs",
                  isToday ? "font-semibold text-primary" : "text-muted-foreground"
                )}>
                  {format(day.date, "dd")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Motivation message */}
        {achievedCount >= 5 && (
          <div className="flex items-center gap-2 text-xs text-success bg-success/10 p-2 rounded-lg">
            <TrendingUp className="w-4 h-4" />
            <span>Excelente semana! Continue assim! 🚀</span>
          </div>
        )}
        {achievedCount >= 3 && achievedCount < 5 && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 p-2 rounded-lg">
            <Flame className="w-4 h-4" />
            <span>Bom progresso! Você está no caminho certo! 💪</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Calculate consecutive days streak ending today
function calculateStreak(data: DayGoalData[]): number {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].achieved) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
