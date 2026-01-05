import { useState } from "react";
import { Package, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductThumbnailProps {
  imageUrl?: string | null;
  isBasket?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function ProductThumbnail({
  imageUrl,
  isBasket = false,
  size = "md",
  className,
}: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = !imageUrl || hasError;

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
        isBasket ? "bg-primary/10" : "bg-muted",
        sizeClasses[size],
        className
      )}
    >
      {showFallback ? (
        isBasket ? (
          <ShoppingBasket className={cn("text-primary", iconSizeClasses[size])} />
        ) : (
          <Package className={cn("text-muted-foreground", iconSizeClasses[size])} />
        )
      ) : (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
