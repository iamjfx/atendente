import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user } = useAuth();
  const { profile } = useAccount();

  const initials = profile?.nome
    ? profile.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="h-12 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      <h1 className="text-sm font-semibold text-foreground/85">
        {profile?.nome_fantasia || profile?.nome || "Atendente"}
      </h1>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {profile?.nome || user?.email}
        </span>
        <Avatar className="w-7 h-7">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
