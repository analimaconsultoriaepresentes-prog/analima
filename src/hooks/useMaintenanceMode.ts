import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        // Fetch from any store (single-user system)
        const { data, error } = await supabase
          .from("stores")
          .select("maintenance_mode")
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching maintenance mode:", error);
          setIsMaintenanceMode(false);
        } else {
          setIsMaintenanceMode(data?.maintenance_mode ?? false);
        }
      } catch (err) {
        console.error("Error:", err);
        setIsMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceMode();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("maintenance-mode")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stores",
        },
        (payload) => {
          if (payload.new && "maintenance_mode" in payload.new) {
            setIsMaintenanceMode(payload.new.maintenance_mode as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isMaintenanceMode, loading };
}
