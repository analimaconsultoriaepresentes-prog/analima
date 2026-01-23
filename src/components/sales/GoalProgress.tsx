import { useEffect, useState, useRef } from "react";
import { Target, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calculateGoalProgress } from "@/hooks/useGoals";

interface GoalProgressProps {
  dailyGoal: number;
  totalToday: number;
  onMilestone?: (type: "near" | "achieved") => void;
}

export function GoalProgress({ dailyGoal, totalToday, onMilestone }: GoalProgressProps) {
  const { percentage, remaining, isAchieved } = calculateGoalProgress(totalToday, dailyGoal);
  const [previousPercentage, setPreviousPercentage] = useState(percentage);
  const hasTriggered80Ref = useRef(false);
  const hasTriggered100Ref = useRef(false);

  // Track milestone triggers
  useEffect(() => {
    // Check for 80% milestone (only trigger once per session)
    if (percentage >= 80 && previousPercentage < 80 && !hasTriggered80Ref.current) {
      hasTriggered80Ref.current = true;
      onMilestone?.("near");
    }
    
    // Check for 100% milestone (only trigger once per session)
    if (percentage >= 100 && previousPercentage < 100 && !hasTriggered100Ref.current) {
      hasTriggered100Ref.current = true;
      onMilestone?.("achieved");
    }
    
    setPreviousPercentage(percentage);
  }, [percentage, previousPercentage, onMilestone]);

  // Don't show if no goal is set
  if (dailyGoal <= 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "bg-card rounded-xl border p-4 transition-all duration-500",
        isAchieved 
          ? "border-success/50 bg-success/5" 
          : "border-border/50"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isAchieved ? (
            <div className="p-1.5 rounded-lg bg-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Target className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            Meta do Dia
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            isAchieved 
              ? "bg-success/10 text-success" 
              : percentage >= 80 
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground"
          )}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative mb-3">
        <Progress 
          value={percentage} 
          className={cn(
            "h-3 transition-all duration-500",
            isAchieved && "[&>div]:bg-success"
          )}
        />
        {/* 80% marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-warning/50"
          style={{ left: "80%" }}
        />
      </div>
      
      {/* Values */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Vendido:</span>
          <span className="font-semibold text-foreground">
            R$ {totalToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-muted-foreground">
          <span>Meta: </span>
          <span className="font-medium text-foreground">
            R$ {dailyGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      {/* Status Message */}
      {isAchieved ? (
        <div className="mt-3 flex items-center gap-2 text-success text-sm animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">🎉 Meta do dia atingida!</span>
        </div>
      ) : remaining > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Faltam <span className="font-medium text-foreground">
            R$ {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span> para atingir a meta
        </div>
      )}
    </div>
  );
}
