import { useState, useEffect, useCallback, useRef } from "react";
import { HelpCircle, X, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useHelp, helpTopics, complexPages } from "./HelpContext";
import { useSound } from "@/hooks/useSound";
import mascotImage from "@/assets/mascot-ana.png";

const INACTIVITY_TIMEOUT = 8000; // 8 seconds of inactivity before showing bubble
const BUBBLE_TRIGGER_DELAY = 1500; // Delay before showing bubble on page change

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

  const pageTopics = helpTopics[currentPage] || [];
  const generalTopics = helpTopics.geral || [];
  const allTopics = [...pageTopics, ...generalTopics];

  const selectedTopicData = allTopics.find((t) => t.id === selectedTopic);

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
    stopPulse();
    hideBubble();
    setShowWave(false);
    if (!isOpen) {
      playHelpPop();
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Speech Bubble with Wave Icon */}
      <div
        className={cn(
          "fixed bottom-[100px] right-6 z-50",
          "max-w-[220px] px-4 py-3",
          "bg-[#ECFDF5] border-2 border-[#22C55E]/60 rounded-2xl",
          "shadow-lg shadow-[#22C55E]/10",
          "transition-all duration-500 ease-out",
          "origin-bottom-right",
          bubbleMessage && !isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-2 pointer-events-none"
        )}
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
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#ECFDF5] border-r-2 border-b-2 border-[#22C55E]/60 rotate-45 transform" />
      </div>

      {/* Mascot Button with Character Image */}
      <button
        onClick={handleMascotClick}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "w-20 h-20 rounded-full overflow-hidden",
          "bg-white border-[3px] border-emerald-400",
          "shadow-lg shadow-emerald-500/20",
          "transition-all duration-300 ease-out",
          "hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30 hover:border-emerald-500",
          "active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2",
          hasAnimated ? "animate-mascot-entry" : "opacity-0 translate-y-8",
          isOpen && "ring-2 ring-emerald-500"
        )}
        aria-label={isOpen ? "Fechar ajuda" : "Abrir ajuda"}
        style={{ animationFillMode: 'forwards' }}
      >
        {isOpen ? (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <X className="w-7 h-7 text-white" />
          </div>
        ) : (
          <img 
            src={mascotImage} 
            alt="Ana - Assistente de Ajuda"
            className="w-[140%] h-auto absolute top-1 left-1/2 -translate-x-1/2"
          />
        )}
      </button>

      {/* Help Panel */}
      <div
        className={cn(
          "fixed bottom-28 right-6 z-40",
          "w-80 max-h-[70vh]",
          "bg-card border border-border rounded-2xl shadow-2xl",
          "transition-all duration-300 ease-out",
          "origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header with larger mascot image */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400 shadow-md relative bg-white">
              <img 
                src={mascotImage} 
                alt="Ana"
                className="w-[180%] h-auto absolute top-0 left-1/2 -translate-x-1/2"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Olá! Sou a Ana 😊</h3>
              <p className="text-xs text-muted-foreground">
                Posso te ajudar com qualquer dúvida!
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
              // Topics List
              <div className="space-y-2">
                {pageTopics.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2">
                      Sobre esta página
                    </p>
                    {pageTopics.map((topic) => (
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
                    ))}
                  </>
                )}

                {generalTopics.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mt-4 mb-2">
                      Termos gerais
                    </p>
                    {generalTopics.map((topic) => (
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
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            💡 Dica: procure o botão <span className="text-primary font-medium">❓</span> nos campos
          </p>
        </div>
      </div>
    </>
  );
}
