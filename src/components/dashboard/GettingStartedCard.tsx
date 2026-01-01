import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGettingStarted } from '@/hooks/useGettingStarted';
import { CheckCircle2, EyeOff, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface GettingStartedCardProps {
  onOpenGiftModal?: () => void;
}

export const GettingStartedCard = ({ onOpenGiftModal }: GettingStartedCardProps) => {
  const navigate = useNavigate();
  const {
    steps,
    completedCount,
    totalSteps,
    allCompleted,
    isHidden,
    isLoading,
    hideGuide,
    showGuide,
  } = useGettingStarted();

  if (isLoading) {
    return null;
  }

  // If hidden and not all completed, show a small "show guide" button
  if (isHidden && !allCompleted) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={showGuide}
        className="mb-4 gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Mostrar Guia de Primeiros Passos
      </Button>
    );
  }

  // If hidden and all completed, don't show anything
  if (isHidden && allCompleted) {
    return null;
  }

  // Avoid NaN/Infinity: if no steps, progress is 0
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  const handleAction = (step: typeof steps[0]) => {
    if (step.action === 'openGiftModal' && onOpenGiftModal) {
      onOpenGiftModal();
    } else if (step.action === 'navigate' && step.route) {
      navigate(step.route);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Comece por aqui</CardTitle>
          </div>
          {!allCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={hideGuide}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Ocultar guia"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Siga os passos abaixo para começar a usar o sistema
        </CardDescription>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-primary">
              {completedCount} de {totalSteps} concluídos
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {allCompleted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">
                Tudo pronto! 🎉
              </p>
              <p className="text-sm text-muted-foreground">
                Você completou todos os passos iniciais
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={hideGuide} className="mt-2">
              Ocultar este guia
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-all',
                    step.completed
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
                  )}
                >
                  {/* Step indicator */}
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    step.completed
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-muted'
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <StepIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium leading-tight',
                        step.completed && 'text-green-700 dark:text-green-400'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {step.description}
                    </p>
                  </div>

                  {/* Action button */}
                  {!step.completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 text-xs"
                      onClick={() => handleAction(step)}
                    >
                      {step.buttonLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}

                  {step.completed && (
                    <span className="shrink-0 text-xs font-medium text-green-600 dark:text-green-400">
                      Concluído
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
