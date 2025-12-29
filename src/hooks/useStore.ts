import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface AlertSettings {
  lowStockEnabled: boolean;
  expiryAlertEnabled: boolean;
  billsDueEnabled: boolean;
  dailyEmailEnabled: boolean;
  lowStockThreshold: number;
  expiryDaysBefore: number;
  billsDaysBefore: number;
}

export interface PackagingCosts {
  packagingCost1Bag: number;
  packagingCost2Bags: number;
}

export interface Store {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  birthdayMessage: string;
  alertSettings: AlertSettings;
  packagingCosts: PackagingCosts;
}

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  lowStockEnabled: true,
  expiryAlertEnabled: true,
  billsDueEnabled: true,
  dailyEmailEnabled: false,
  lowStockThreshold: 3,
  expiryDaysBefore: 30,
  billsDaysBefore: 3,
};

const DEFAULT_PACKAGING_COSTS: PackagingCosts = {
  packagingCost1Bag: 0,
  packagingCost2Bags: 0,
};

export function useStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStore = async () => {
    if (!user) {
      setStore(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStore({
          id: data.id,
          name: data.name,
          logoUrl: data.logo_url,
          primaryColor: data.primary_color || "#F97316",
          birthdayMessage: data.birthday_message || "Oi {NOME}! 🎉 Feliz aniversário! Preparamos presentes e cestas personalizadas especialmente para você. Quer que eu te mostre algumas opções?",
          alertSettings: {
            lowStockEnabled: data.low_stock_enabled ?? true,
            expiryAlertEnabled: data.expiry_alert_enabled ?? true,
            billsDueEnabled: data.bills_due_enabled ?? true,
            dailyEmailEnabled: data.daily_email_enabled ?? false,
            lowStockThreshold: data.low_stock_threshold ?? 3,
            expiryDaysBefore: data.expiry_days_before ?? 30,
            billsDaysBefore: data.bills_days_before ?? 3,
          },
          packagingCosts: {
            packagingCost1Bag: Number(data.packaging_cost_1_bag) || 0,
            packagingCost2Bags: Number(data.packaging_cost_2_bags) || 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching store:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [user]);

  const updateStore = async (name: string, primaryColor: string, birthdayMessage?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: Record<string, string> = { name, primary_color: primaryColor };
      if (birthdayMessage !== undefined) {
        updateData.birthday_message = birthdayMessage;
      }
      
      const { error } = await supabase
        .from("stores")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      setStore(prev => prev ? { 
        ...prev, 
        name, 
        primaryColor,
        ...(birthdayMessage !== undefined && { birthdayMessage })
      } : null);
      toast({
        title: "Configurações salvas",
        description: "As alterações foram aplicadas com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Error updating store:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateAlertSettings = async (settings: AlertSettings): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          low_stock_enabled: settings.lowStockEnabled,
          expiry_alert_enabled: settings.expiryAlertEnabled,
          bills_due_enabled: settings.billsDueEnabled,
          daily_email_enabled: settings.dailyEmailEnabled,
          low_stock_threshold: settings.lowStockThreshold,
          expiry_days_before: settings.expiryDaysBefore,
          bills_days_before: settings.billsDaysBefore,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setStore(prev => prev ? { ...prev, alertSettings: settings } : null);
      toast({
        title: "Configurações salvas",
        description: "As preferências de alertas foram atualizadas.",
      });
      return true;
    } catch (error) {
      console.error("Error updating alert settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePackagingCosts = async (costs: PackagingCosts): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          packaging_cost_1_bag: costs.packagingCost1Bag,
          packaging_cost_2_bags: costs.packagingCost2Bags,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setStore(prev => prev ? { ...prev, packagingCosts: costs } : null);
      toast({
        title: "Configurações salvas",
        description: "Os custos de embalagem foram atualizados.",
      });
      return true;
    } catch (error) {
      console.error("Error updating packaging costs:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      // Update store with logo URL
      const { error: updateError } = await supabase
        .from("stores")
        .update({ logo_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setStore(prev => prev ? { ...prev, logoUrl: publicUrl } : null);
      
      toast({
        title: "Logo atualizado",
        description: "A logo da sua loja foi atualizada.",
      });
      
      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Erro ao enviar logo",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    store,
    loading,
    updateStore,
    updateAlertSettings,
    updatePackagingCosts,
    uploadLogo,
    refetch: fetchStore,
  };
}
