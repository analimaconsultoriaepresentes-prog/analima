import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useGettingStarted } from '@/hooks/useGettingStarted';
import { CheckCircle2, EyeOff, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GettingStartedCard = () => {
  const {
    steps,
    completedCount,
    totalSteps,
    allCompleted,
    isHidden,
    isLoading,
    toggleStep,
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

  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
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
          Siga os passos abaixo para configurar seu sistema
        </CardDescription>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {completedCount} de {totalSteps}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {allCompleted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-600 dark:text-green-400">
                Tudo pronto! Sistema configurado 🎉
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
            {steps.map((step) => (
              <div
                key={step.key}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  step.completed
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : 'border-border bg-card hover:bg-accent/50'
                )}
              >
                <Checkbox
                  id={`step-${step.key}`}
                  checked={step.completed}
                  onCheckedChange={() => toggleStep(step.key, step.completed)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`step-${step.key}`}
                  className="flex-1 cursor-pointer"
                >
                  <p
                    className={cn(
                      'font-medium leading-tight',
                      step.completed && 'line-through opacity-70'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
