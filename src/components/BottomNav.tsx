import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, MessageCircle, Settings, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", icon: Home, href: "/admin" },
  { label: "Agenda", icon: Calendar, href: "/agenda" },
  { label: "Conversas", icon: MessageCircle, href: "/conversas" },
  { label: "Config", icon: Settings, href: "/configuracoes" },
  { label: "Suporte", icon: LifeBuoy, href: "/suporte" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  const renderItem = (item: { label: string; icon: typeof Home; href: string }) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex flex-col items-center justify-center flex-1 gap-0.5 rounded-xl py-1.5 px-1 transition-all duration-200",
          active
            ? "bg-primary/10 text-primary scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon
          className={cn(
            "transition-all",
            active ? "h-6 w-6" : "h-5 w-5"
          )}
        />
        <span className="text-[10px] font-medium leading-none">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="md:hidden fixed left-3 right-3 bottom-3 z-[56] mx-auto max-w-md"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around gap-1 rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-elevated px-2 py-2">
        {navItems.map(renderItem)}
      </div>
    </nav>
  );
}