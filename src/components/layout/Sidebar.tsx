import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
  Store,
  ChevronLeft,
  Loader2,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", path: "/" },
  { icon: Package, label: "Produtos", path: "/produtos" },
  { icon: ShoppingCart, label: "Vendas", path: "/vendas" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Receipt, label: "Despesas", path: "/despesas" },
  { icon: CreditCard, label: "Contas", path: "/contas" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { store, loading } = useStore();

  const storeName = store?.name || "Minha Loja";
  const storeLogo = store?.logoUrl;

  return (
    <>
      {/* Mobile menu button - premium gradient style */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden min-h-[44px] min-w-[44px] bg-card/90 backdrop-blur-md shadow-lg border border-border/30 hover:shadow-xl transition-all duration-300"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Mobile overlay with blur */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Premium dark gradient */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full gradient-sidebar z-40 transition-all duration-300 ease-in-out shadow-xl",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50">
          <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed && "justify-center")}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-sidebar-muted" />
            ) : storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/30" />
            ) : (
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            {!isCollapsed && !loading && (
              <span className="font-semibold text-sidebar-foreground truncate">{storeName}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active",
                  isCollapsed && "justify-center px-3"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer with branding */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border/50">
            <div className="flex items-center justify-center gap-1.5 text-xs text-sidebar-muted">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>© 2026 ANALIMA</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
