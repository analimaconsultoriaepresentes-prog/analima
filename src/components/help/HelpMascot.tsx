import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, Move } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useHelp, helpTopics, complexPages } from "./HelpContext";
import { useSound } from "@/hooks/useSound";
import { useDraggable } from "@/hooks/useDraggable";
import mascotImage from "@/assets/mascot-ana.png";

const INACTIVITY_TIMEOUT = 8000; // 8 seconds of inactivity before showing bubble
const BUBBLE_TRIGGER_DELAY = 1500; // Delay before showing bubble on page change
const MASCOT_SIZE = { width: 96, height: 96 };

export function HelpMascot() {
  const { 
    isOpen, 
    setIsOpen, 
    currentPage, 
    shouldPulse, 
    triggerPulse, 
    stopPulse,
    visitedPages,
    markPageVisited,
    bubbleMessage,
    showBubble,
    hideBubble
  } = useHelp();
  const { playHelpPop } = useSound();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Draggable functionality
  const {
    position,
    isDragging,
    wasDragged,
    handleMouseDown,
  } = useDraggable({
    storageKey: "mascot-position",
    perRoute: true,
    currentRoute: currentPage,
    elementSize: MASCOT_SIZE,
    margin: 12,
    dragThreshold: 8,
    snapToEdge: true,
  });

  // Only show page-specific topics - no generic topics mixed in
  const pageTopics = helpTopics[currentPage] || [];
  const selectedTopicData = pageTopics.find((t) => t.id === selectedTopic);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Stop current pulse on user activity
    stopPulse();
    
    // Set new timer for inactivity
    if (!isOpen) {
      inactivityTimerRef.current = setTimeout(() => {
        triggerPulse();
        showBubble();
        setShowWave(true);
        // Hide wave after animation
        setTimeout(() => setShowWave(false), 2000);
      }, INACTIVITY_TIMEOUT);
    }
  }, [isOpen, stopPulse, triggerPulse, showBubble]);

  // Handle page changes - animate on first visit to complex pages
  useEffect(() => {
    const isComplexPage = complexPages.includes(currentPage);
    const isFirstVisit = !visitedPages.has(currentPage);
    
    if (isComplexPage && isFirstVisit) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setHasAnimated(false);
        triggerPulse();
        markPageVisited(currentPage);
        // Trigger entry animation
        requestAnimationFrame(() => {
          setHasAnimated(true);
          setShowWave(true);
        });
        // Show bubble after a bit more delay
        setTimeout(() => {
          showBubble();
        }, BUBBLE_TRIGGER_DELAY);
        // Hide wave after animation completes
        setTimeout(() => setShowWave(false), 2500);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      markPageVisited(currentPage);
      // Still animate on mount
      if (!hasAnimated) {
        requestAnimationFrame(() => setHasAnimated(true));
      }
    }
  }, [currentPage, visitedPages, triggerPulse, markPageVisited, showBubble, hasAnimated]);

  // Setup inactivity detection
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Stop pulse when panel opens
  useEffect(() => {
    if (isOpen) {
      stopPulse();
      hideBubble();
      setShowWave(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [isOpen, stopPulse, hideBubble]);

  const handleMascotClick = () => {
    // Only open help if not dragging
    if (wasDragged) return;
    
    stopPulse();
    hideBubble();
    setShowWave(false);
    if (!isOpen) {
      playHelpPop();
    }
    setIsOpen(!isOpen);
  };

  // Calculate bubble position relative to mascot
  const bubbleStyle = {
    left: position.x < window.innerWidth / 2 
      ? `${position.x + MASCOT_SIZE.width + 8}px` 
      : "auto",
    right: position.x >= window.innerWidth / 2 
      ? `${window.innerWidth - position.x + 8}px` 
      : "auto",
    bottom: `${window.innerHeight - position.y + 8}px`,
  };

  // Calculate panel position relative to mascot
  const panelStyle = {
    left: position.x < window.innerWidth / 2 
      ? `${position.x}px` 
      : "auto",
    right: position.x >= window.innerWidth / 2 
      ? `${window.innerWidth - position.x - MASCOT_SIZE.width}px` 
      : "auto",
    bottom: `${window.innerHeight - position.y + MASCOT_SIZE.height + 8}px`,
  };

  return (
    <>
      {/* Speech Bubble with Wave Icon */}
      <div
        className={cn(
          "fixed z-50",
          "max-w-[220px] px-4 py-3",
          "bg-[#ECFDF5] border-2 border-[#22C55E]/60 rounded-2xl",
          "shadow-lg shadow-[#22C55E]/10",
          "transition-all duration-500 ease-out",
          "origin-bottom-right",
          bubbleMessage && !isOpen && !isDragging
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-2 pointer-events-none"
        )}
        style={bubbleStyle}
      >
        <div className="flex items-start gap-2">
          {/* Animated wave icon */}
          <span 
            className={cn(
              "text-lg transition-all duration-300",
              showWave && "animate-wave"
            )}
          >
            👋
          </span>
          <p className="text-sm text-[#065F46] font-medium leading-snug flex-1">{bubbleMessage}</p>
        </div>
        {/* Bubble tail */}
        <div className={cn(
          "absolute -bottom-2 w-4 h-4 bg-[#ECFDF5] border-r-2 border-b-2 border-[#22C55E]/60 rotate-45 transform",
          position.x < window.innerWidth / 2 ? "left-4" : "right-8"
        )} />
      </div>

      {/* Mascot Button - Draggable */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onClick={handleMascotClick}
            className={cn(
              "fixed z-50",
              "w-24 h-24",
              "transition-opacity duration-200",
              isDragging ? "opacity-70 cursor-grabbing" : "cursor-grab hover:scale-105",
              "active:cursor-grabbing",
              "focus:outline-none select-none touch-none",
              hasAnimated ? "animate-mascot-entry" : "opacity-0 translate-y-8"
            )}
            style={{ 
              left: `${position.x}px`, 
              top: `${position.y}px`,
              animationFillMode: 'forwards',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            role="button"
            tabIndex={0}
            aria-label={isOpen ? "Fechar ajuda" : "Abrir ajuda (arraste para mover)"}
          >
            {isOpen ? (
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <X className="w-6 h-6 text-foreground" />
              </div>
            ) : (
              <img 
                src={mascotImage} 
                alt="Ana - Assistente de Ajuda"
                className={cn(
                  "w-full h-full object-contain drop-shadow-lg pointer-events-none",
                  isDragging && "scale-95"
                )}
              />
            )}
          </div>
        </TooltipTrigger>
        {!isOpen && !isDragging && (
          <TooltipContent side="left" className="flex items-center gap-1.5">
            <Move className="w-3 h-3" />
            <span>Arraste para mover</span>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Help Panel */}
      <div
        className={cn(
          "fixed z-40",
          "w-80 max-h-[70vh]",
          "bg-card border border-border rounded-2xl shadow-2xl",
          "transition-all duration-300 ease-out",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
        style={panelStyle}
      >
        {/* Header with mascot image - clean style */}
        <div className="p-4 border-b border-border bg-muted/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0">
              <img 
                src={mascotImage} 
                alt="Ana"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Olá! Sou a Ana 😊</h3>
              <p className="text-xs text-muted-foreground">
                Posso te ajudar aqui rapidinho!
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(70vh-140px)] max-h-72">
          <div className="p-3">
            {selectedTopic && selectedTopicData ? (
              // Topic Detail View
              <div className="animate-fade-in">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Voltar
                </button>
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-2">
                    {selectedTopicData.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedTopicData.content}
                  </p>
                </div>
              </div>
            ) : (
              // Topics List - only page-specific topics
              <div className="space-y-2">
                {pageTopics.length > 0 ? (
                  pageTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl",
                        "bg-muted/30 hover:bg-muted/60",
                        "transition-colors duration-200",
                        "flex items-center justify-between group"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {topic.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma dúvida específica para esta página. 😊
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            💡 Clique em qualquer pergunta para ver a resposta!
          </p>
        </div>
      </div>
    </>
  );
}
