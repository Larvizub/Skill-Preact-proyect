import { route } from "preact-router";
import {
  LayoutDashboard,
  Calendar,
  Building,
  Package,
  Users,
  UserCircle,
  UserCog,
  ClipboardList,
  Sun,
  Moon,
  X,
  CalendarCheck,
  Search,
  LogOut,
  BriefcaseBusiness,
  Settings,
  ChevronRight,
  ChevronDown,
} from "lucide-preact";
import { useMemo, useState } from "preact/hooks";
import type { LucideIcon } from "lucide-preact";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";
import { authService } from "../../services/auth.service";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  id: string;
  path?: string;
  label: string;
  icon: LucideIcon;
  children?: Array<Omit<MenuItem, "children">>;
}

const menuItems: MenuItem[] = [
  { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendario", path: "/calendario", label: "Calendario", icon: Calendar },
  {
    id: "crm",
    label: "CRM",
    icon: BriefcaseBusiness,
    children: [
      {
        id: "crm-oportunidades",
        path: "/crm",
        label: "Oportunidades",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    id: "skill",
    label: "SKILL",
    icon: ClipboardList,
    children: [
      { id: "eventos", path: "/eventos", label: "Eventos", icon: ClipboardList },
      { id: "consultas", path: "/consultas", label: "Consulta de Servicios", icon: Search },
      { id: "salones", path: "/salones", label: "Salones", icon: Building },
      {
        id: "salones-disponibles",
        path: "/salones-disponibles",
        label: "Salones Disponibles",
        icon: CalendarCheck,
      },
      { id: "inventario", path: "/inventario", label: "Inventario", icon: Package },
      { id: "clientes", path: "/clientes", label: "Clientes", icon: Users },
      { id: "contactos", path: "/contactos", label: "Contactos", icon: UserCircle },
      { id: "coordinadores", path: "/coordinadores", label: "Coordinadores", icon: UserCog },
    ],
  },
  { id: "configuracion", path: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    crm: true,
    skill: true,
  });

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  const isPathActive = (path?: string) => {
    if (!path) return false;
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const groupsWithActiveChild = useMemo(() => {
    const activeGroups: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (!item.children) return;
      activeGroups[item.id] = item.children.some((child) => isPathActive(child.path));
    });
    return activeGroups;
  }, [currentPath]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleNavigate = (path: string) => {
    route(path);
    // Cerrar el sidebar en móvil después de navegar
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    authService.logout();
    route("/login", true);
    if (onClose) {
      onClose();
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col w-64 h-screen bg-card border-r border-border transition-transform duration-300 ease-in-out",
          // En móvil: posición fija con animación
          "fixed lg:relative z-50",
          // Ocultar/mostrar en móvil
          !isOpen && "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header con logo y botón cerrar en móvil */}
        <div className="flex flex-col border-b border-border">
          {/* Logo de Heroica */}
          <div className="flex justify-center pt-6 pb-3">
            <img
              src="https://costaricacc.com/cccr/Logoheroica.png"
              alt="Logo Heroica"
              className="h-16 w-auto dark:invert transition-all"
            />
          </div>

          {/* Título y botón cerrar */}
          <div className="flex items-center justify-between px-6 pb-6">
            <h1 className="text-2xl font-bold text-primary">Skill Platform</h1>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-md hover:bg-accent"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const isGroupActive = hasChildren
                ? groupsWithActiveChild[item.id]
                : isPathActive(item.path);
              const isGroupExpanded = hasChildren
                ? expandedGroups[item.id] || groupsWithActiveChild[item.id]
                : false;

              return (
                <li key={item.id}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleGroup(item.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2 rounded-md text-[13px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                          isGroupActive && "bg-primary text-primary-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1">{item.label}</span>
                        {isGroupExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {isGroupExpanded && (
                        <div className="relative mt-1 ml-5 pl-4">
                          <span className="absolute left-0 top-1 bottom-1 w-px bg-border rounded-full" />
                          <ul className="space-y-1">
                            {item.children?.map((child) => {
                              const isChildActive = isPathActive(child.path);
                              return (
                                <li key={child.id}>
                                  <button
                                    onClick={() => child.path && handleNavigate(child.path)}
                                    className={cn(
                                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-xs transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                                      isChildActive && "bg-primary text-primary-foreground font-medium"
                                    )}
                                  >
                                    <child.icon className="w-4 h-4" />
                                    <span>{child.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => item.path && handleNavigate(item.path)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-md text-[13px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                        isGroupActive && "bg-primary text-primary-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme Toggle + Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Tema Oscuro</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-left hover:bg-destructive/15 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
