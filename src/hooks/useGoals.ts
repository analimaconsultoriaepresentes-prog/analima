import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface GoalSettings {
  dailyGoal: number;
  monthlyGoal: number;
}

const DEFAULT_GOAL_SETTINGS: GoalSettings = {
  dailyGoal: 0,
  monthlyGoal: 0,
};

export function useGoals() {
  const { user } = useAuth();
  const [goalSettings, setGoalSettings] = useState<GoalSettings>(DEFAULT_GOAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    if (!user) {
      setGoalSettings(DEFAULT_GOAL_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("stores")
        .select("daily_goal, monthly_goal")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGoalSettings({
          dailyGoal: Number(data.daily_goal) || 0,
          monthlyGoal: Number(data.monthly_goal) || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const updateGoals = async (settings: GoalSettings): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          daily_goal: settings.dailyGoal,
          monthly_goal: settings.monthlyGoal,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setGoalSettings(settings);
      toast({
        title: "Meta configurada",
        description: "Suas metas de vendas foram atualizadas.",
      });
      return true;
    } catch (error) {
      console.error("Error updating goals:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    goalSettings,
    loading,
    updateGoals,
    refetch: fetchGoals,
  };
}

// Progress calculation helper
export function calculateGoalProgress(currentValue: number, goalValue: number) {
  if (goalValue <= 0) {
    return { percentage: 0, remaining: 0, isAchieved: false };
  }
  
  const percentage = Math.min((currentValue / goalValue) * 100, 100);
  const remaining = Math.max(goalValue - currentValue, 0);
  const isAchieved = currentValue >= goalValue;
  
  return { percentage, remaining, isAchieved };
}
