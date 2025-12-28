import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        "lg:ml-64"
      )}>
        <div className="p-4 pt-16 sm:p-5 sm:pt-20 lg:p-6 lg:pt-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
