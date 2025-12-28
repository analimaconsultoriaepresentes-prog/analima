import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        "lg:ml-64 min-h-screen w-full"
      )}>
        <div className="p-3 pt-16 sm:p-4 sm:pt-20 lg:p-6 lg:pt-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
