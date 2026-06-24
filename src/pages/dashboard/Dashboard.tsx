import { useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import {
  MessageCircle,
  Users,
  CalendarDays,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Stats {
  conversasHoje: number;
  mensagensNaoLidas: number;
  totalClientes: number;
  evolutionConectado: boolean;
}

export default function Dashboard() {
  const { profile } = useAccount();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    conversasHoje: 0,
    mensagensNaoLidas: 0,
    totalClientes: 0,
    evolutionConectado: false,
  });
  const [loading, setLoading] = useState(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  useEffect(() => {
    if (!profile?.id) return;
    loadStats();
  }, [profile?.id]);

  async function loadStats() {
    const accountId = profile!.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const API = import.meta.env.VITE_API_BASE_URL || "/api";

    try {
      const [convRes, unreadRes, totalRes, instRes] = await Promise.all([
        fetch(`${API}/instances/${accountId}`).catch(() => null),
      ]);

      const instances = instRes ? await instRes.json().catch(() => []) : [];
      const connected = Array.isArray(instances)
        ? instances.some((i: any) => i.connection_status === "connected")
        : false;

      setStats({
        conversasHoje: 0,
        mensagensNaoLidas: 0,
        totalClientes: 0,
        evolutionConectado: connected,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {profile?.nome_usuario?.split(" ")[0] ?? profile?.nome?.split(" ")[0] ?? "usuário"} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo do seu atendente inteligente
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Conversas hoje
            </CardTitle>
            <MessageCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversasHoje}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Não lidas
            </CardTitle>
            <Users className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.mensagensNaoLidas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Clientes
            </CardTitle>
            <CalendarDays className="w-4 h-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              WhatsApp
            </CardTitle>
            {stats.evolutionConectado ? (
              <Wifi className="w-4 h-4 text-[#22c55e]" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className={stats.evolutionConectado ? "text-[#22c55e]" : "text-muted-foreground"}>
                {stats.evolutionConectado ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
            onClick={() => navigate("/configuracoes")}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Conectar WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Configure a Evolution API em Configurações para começar a receber mensagens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Testar atendimento</p>
              <p className="text-xs text-muted-foreground">
                Mande uma mensagem para o número conectado e veja a IA responder
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
