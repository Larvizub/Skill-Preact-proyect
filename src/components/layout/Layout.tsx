import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-preact";

interface LayoutProps {
  children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Botón de menú para móvil */}
        <div className="sticky top-0 z-30 lg:hidden bg-card border-b border-border p-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-accent"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="container mx-auto px-6 pt-6 pb-6 min-h-0 flex flex-col flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
