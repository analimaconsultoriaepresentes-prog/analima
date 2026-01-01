import { Construction } from "lucide-react";

export default function Manutencao() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Sistema em manutenção
        </h1>
        <p className="text-muted-foreground mb-8">
          Volte em alguns minutos.
        </p>
        <p className="text-sm text-muted-foreground/60">
          © 2026 ANALIMA
        </p>
      </div>
    </div>
  );
}
