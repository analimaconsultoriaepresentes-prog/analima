import { useState } from "react";
import { HelpCircle, X, Sparkles, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useHelp, helpTopics } from "./HelpContext";

export function HelpMascot() {
  const { isOpen, setIsOpen, currentPage } = useHelp();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const pageTopics = helpTopics[currentPage] || [];
  const generalTopics = helpTopics.geral || [];
  const allTopics = [...pageTopics, ...generalTopics];

  const selectedTopicData = allTopics.find((t) => t.id === selectedTopic);

  return (
    <>
      {/* Mascot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary via-primary to-accent",
          "text-white shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-primary/25",
          "active:scale-95",
          "group",
          isOpen && "rotate-180"
        )}
        aria-label={isOpen ? "Fechar ajuda" : "Abrir ajuda"}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        )}
      </button>

      {/* Help Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40",
          "w-80 max-h-[70vh]",
          "bg-card border border-border rounded-2xl shadow-2xl",
          "transition-all duration-300 ease-out",
          "origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Olá! Precisa de ajuda?</h3>
              <p className="text-xs text-muted-foreground">
                Toque em um tema para saber mais
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(70vh-120px)] max-h-80">
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
