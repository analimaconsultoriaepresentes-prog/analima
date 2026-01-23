import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpProvider, HelpMascot, useHelp } from "@/components/help";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import Clientes from "./pages/Clientes";
import Despesas from "./pages/Despesas";
import Contas from "./pages/Contas";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import Manutencao from "./pages/Manutencao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const ALLOWED_EMAIL = "analimaconsultoriaepresentes@gmail.com";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();

  if (loading || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = user.email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase();

  // Backend validation: check if user email is allowed
  if (!isAdmin) {
    // If maintenance mode is on, redirect non-admin users to maintenance page
    if (isMaintenanceMode) {
      return <Navigate to="/manutencao" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Sistema exclusivo da loja <strong className="text-foreground">ANA LIMA</strong>.
          </p>
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="min-h-[48px]"
          >
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <HelpPageTracker>
      <AppLayout>{children}</AppLayout>
    </HelpPageTracker>
  );
}

// Component to track current page for help context
function HelpPageTracker({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { setCurrentPage } = useHelp();

  // Update help context based on current route
  React.useEffect(() => {
    const path = location.pathname.replace("/", "") || "dashboard";
    setCurrentPage(path);
  }, [location.pathname, setCurrentPage]);

  return (
    <>
      {children}
      <HelpMascot />
    </>
  );
}

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();

  if (loading || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase();

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route 
        path="/manutencao" 
        element={
          isMaintenanceMode && !isAdmin 
            ? <Manutencao /> 
            : <Navigate to="/" replace />
        } 
      />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/despesas" element={<ProtectedRoute><Despesas /></ProtectedRoute>} />
      <Route path="/contas" element={<ProtectedRoute><Contas /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelpProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </HelpProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
