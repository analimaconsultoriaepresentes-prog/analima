import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface Store {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}

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

  const updateStore = async (name: string, primaryColor: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("stores")
        .update({ name, primary_color: primaryColor })
        .eq("user_id", user.id);

      if (error) throw error;

      setStore(prev => prev ? { ...prev, name, primaryColor } : null);
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
    uploadLogo,
    refetch: fetchStore,
  };
}
