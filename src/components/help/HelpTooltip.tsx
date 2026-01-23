import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldTooltips } from "./HelpContext";

interface HelpTooltipProps {
  fieldKey: keyof typeof fieldTooltips;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ 
  fieldKey, 
  className,
  position = "top" 
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = fieldTooltips[fieldKey];

  if (!content) return null;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-card border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-card border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-card border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-card border-y-transparent border-l-transparent",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-5 h-5 rounded-full",
          "flex items-center justify-center",
          "text-muted-foreground hover:text-primary",
          "hover:bg-primary/10",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
          isOpen && "text-primary bg-primary/10"
        )}
        aria-label="O que é isso?"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Tooltip Popup */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div
            className={cn(
              "absolute z-50",
              positionClasses[position],
              "w-64 p-3",
              "bg-card border border-border rounded-xl shadow-lg",
              "animate-fade-in"
            )}
          >
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-0 h-0",
                "border-[6px]",
                arrowClasses[position]
              )}
            />
            
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Content */}
            <p className="text-sm text-foreground leading-relaxed pr-4">
              {content}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
