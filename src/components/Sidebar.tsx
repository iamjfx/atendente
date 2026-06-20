import { useEffect, useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="hsl(220,78%,48%)" />
    <path d="M6 13.5C6 10.462 8.462 8 11.5 8H12.5C15.538 8 18 10.462 18 13.5C18 16.538 15.538 19 12.5 19H11.5C10.5 19 9.5 18.5 9 18L6 19L7 16.5C6.5 15.8 6 14.8 6 13.5Z" fill="white" />
    <circle cx="10" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
    <circle cx="12" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
    <circle cx="14" cy="12" r="0.5" fill="hsl(220,78%,48%)" />
  </svg>
);

const allRoutes = [
  { label: "Início", icon: Home, href: "/admin", show: true },
  { label: "Agenda", icon: Calendar, href: "/agenda", show: true },
  { label: "Conversas", icon: MessageCircle, href: "/conversas", show: true },
  { label: "Configurações", icon: Settings, href: "/configuracoes", show: true },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sidebar:collapsed") === "true";
  });

  useEffect(() => {
    window.localStorage.setItem("sidebar:collapsed", String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const routes = useMemo(() => allRoutes.filter((r) => r.show), []);

  return (
    <div className={cn(
      "relative h-full min-h-screen pb-24 border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
      collapsed ? "w-16" : "w-52"
    )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className={cn("flex items-center justify-center mb-6", collapsed ? "" : "space-x-2 px-3 justify-start")}>
            <Logo />
            {!collapsed && (
              <h2 className="text-lg font-semibold tracking-tight text-sidebar-foreground animate-fade-in">Atendente</h2>
            )}
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="space-y-1">
              {routes.map((route) => {
                const isActive = location.pathname === route.href;
                const link = (
                  <Link
                    key={route.href}
                    to={route.href}
                    className={cn(
                      "flex items-center gap-x-2 text-sm font-medium p-3 rounded-lg transition-all relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center"
                    )}
                    aria-label={collapsed ? route.label : undefined}
                  >
                    <route.icon className="h-4 w-4" />
                    {!collapsed && (
                      <span>{route.label}</span>
                    )}
                  </Link>
                );
                if (!collapsed) return link;
                return (
                  <Tooltip key={route.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{route.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
      <TooltipProvider delayDuration={200}>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          {(() => {
            const toggleBtn = (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("w-full text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed ? "justify-center" : "justify-start")}
              >
                {collapsed ? "→" : "←"}
                {!collapsed && <span className="ml-2">Recolher</span>}
              </Button>
            );
            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{toggleBtn}</TooltipTrigger>
                <TooltipContent side="right">Expandir</TooltipContent>
              </Tooltip>
            ) : toggleBtn;
          })()}
          {user && (() => {
            const logoutBtn = (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={cn("w-full text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed ? "justify-center" : "justify-start")}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Sair</span>}
              </Button>
            );
            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{logoutBtn}</TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            ) : logoutBtn;
          })()}
        </div>
      </TooltipProvider>
    </div>
  );
}