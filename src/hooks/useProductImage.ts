import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function useProductImage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, productId?: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Use apenas JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB.",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = productId 
        ? `${user.id}/${productId}/${timestamp}.${ext}`
        : `${user.id}/temp/${timestamp}.${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!user || !imageUrl) return false;

    try {
      // Extract path from URL
      const urlParts = imageUrl.split("/product-images/");
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from("product-images")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting image:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };

  const updateProductImageUrl = async (productId: string, imageUrl: string | null): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ image_url: imageUrl })
        .eq("id", productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating product image URL:", error);
      return false;
    }
  };

  return {
    uploading,
    uploadImage,
    deleteImage,
    updateProductImageUrl,
  };
}
