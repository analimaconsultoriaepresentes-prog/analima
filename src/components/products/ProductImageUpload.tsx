import { useState, useRef } from "react";
import { Camera, ImagePlus, Trash2, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProductImage } from "@/hooks/useProductImage";

interface ProductImageUploadProps {
  imageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  productId?: string;
  className?: string;
}

export function ProductImageUpload({
  imageUrl,
  onImageChange,
  productId,
  className,
}: ProductImageUploadProps) {
  const { uploading, uploadImage, deleteImage } = useProductImage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setImageError(false);

    // Upload to storage
    const url = await uploadImage(file, productId);
    
    if (url) {
      setPreviewUrl(url);
      onImageChange(url);
    } else {
      // Revert on error
      setPreviewUrl(imageUrl || null);
    }

    // Clean up object URL
    URL.revokeObjectURL(localPreview);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (previewUrl && previewUrl !== imageUrl) {
      // Just clear preview if it's a temp image
      setPreviewUrl(null);
      onImageChange(null);
      return;
    }

    if (imageUrl) {
      // Delete from storage
      await deleteImage(imageUrl);
    }

    setPreviewUrl(null);
    onImageChange(null);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium leading-none">
        Foto do Produto
      </label>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className={cn(
          "w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50",
          previewUrl && !imageError && "border-solid border-primary/30"
        )}>
          {previewUrl && !imageError ? (
            <img
              src={previewUrl}
              alt="Preview do produto"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <Package className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="justify-start gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4" />
                {previewUrl ? "Trocar foto" : "Adicionar foto"}
              </>
            )}
          </Button>

          {previewUrl && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Remover foto
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WebP. Máx 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
