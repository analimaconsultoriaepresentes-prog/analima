import { useEffect, useState, useRef } from "react";
import { Target, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calculateGoalProgress } from "@/hooks/useGoals";

interface GoalProgressProps {
  dailyGoal: number;
  totalToday: number;
  onMilestone?: (type: "near" | "achieved" | "exceeded") => void;
}

export function GoalProgress({ dailyGoal, totalToday, onMilestone }: GoalProgressProps) {
  const { percentage, isAchieved } = calculateGoalProgress(totalToday, dailyGoal);
  const [previousPercentage, setPreviousPercentage] = useState(percentage);
  const hasTriggered80Ref = useRef(false);
  const hasTriggered100Ref = useRef(false);
  const hasTriggered150Ref = useRef(false);

  // Calculate actual percentage (can go above 100%)
  const actualPercentage = dailyGoal > 0 ? (totalToday / dailyGoal) * 100 : 0;

  // Track milestone triggers
  useEffect(() => {
    // Near goal (80%) - only trigger if not yet achieved (< 100%)
    if (actualPercentage >= 80 && actualPercentage < 100 && previousPercentage < 80 && !hasTriggered80Ref.current) {
      hasTriggered80Ref.current = true;
      onMilestone?.("near");
    }
    
    // Goal achieved (100%) - trigger once when reaching 100%
    if (actualPercentage >= 100 && previousPercentage < 100 && !hasTriggered100Ref.current) {
      hasTriggered100Ref.current = true;
      onMilestone?.("achieved");
    }
    
    // Goal exceeded by 50%+ (150%+) - special celebration
    if (actualPercentage >= 150 && previousPercentage < 150 && !hasTriggered150Ref.current) {
      hasTriggered150Ref.current = true;
      onMilestone?.("exceeded");
    }
    
    setPreviousPercentage(actualPercentage);
  }, [actualPercentage, previousPercentage, onMilestone]);

  if (dailyGoal <= 0) {
    return null;
  }

  const formatCurrency = (value: number) => 
    value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="flex items-center gap-3 py-1.5 px-1">
      {/* Icon */}
      {isAchieved ? (
        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
      ) : (
        <Target className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
      
      {/* Values */}
      <span className={cn(
        "text-sm whitespace-nowrap",
        isAchieved ? "text-success font-medium" : "text-muted-foreground"
      )}>
        <span className="font-medium text-foreground">R$ {formatCurrency(totalToday)}</span>
        <span className="mx-1">/</span>
        <span>R$ {formatCurrency(dailyGoal)}</span>
      </span>
      
      {/* Progress Bar */}
      <div className="flex-1 max-w-32">
        <Progress 
          value={percentage} 
          className={cn(
            "h-1.5",
            isAchieved && "[&>div]:bg-success"
          )}
        />
      </div>
      
      {/* Percentage or Status */}
      <span className={cn(
        "text-xs font-medium whitespace-nowrap",
        isAchieved 
          ? "text-success" 
          : percentage >= 80 
            ? "text-warning"
            : "text-muted-foreground"
      )}>
        {isAchieved ? "✓ Meta batida" : `${percentage.toFixed(0)}%`}
      </span>
    </div>
  );
}
