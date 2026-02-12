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
  UsersRound,
  Car,
  LogOut,
  BriefcaseBusiness,
} from "lucide-preact";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";
import { authService } from "../../services/auth.service";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/crm", label: "CRM", icon: BriefcaseBusiness },
  { path: "/eventos", label: "Eventos", icon: ClipboardList },
  { path: "/calendario", label: "Calendario", icon: Calendar },
  { path: "/salones", label: "Salones", icon: Building },
  {
    path: "/salones-disponibles",
    label: "Salones Disponibles",
    icon: CalendarCheck,
  },
  { path: "/inventario", label: "Inventario", icon: Package },
  { path: "/personal-eventos", label: "Personal Eventos", icon: UsersRound },
  { path: "/parqueos-eventos", label: "Parqueos Eventos", icon: Car },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/contactos", label: "Contactos", icon: UserCircle },
  { path: "/coordinadores", label: "Coordinadores", icon: UserCog },
];

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const { theme, setTheme } = useTheme();

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
              const isActive =
                typeof window !== "undefined" &&
                window.location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
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
