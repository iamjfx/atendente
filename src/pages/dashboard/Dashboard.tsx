import { useEffect, useState, useRef } from "react";
import { useAccount } from "@/contexts/AccountContext";
import {
  MessageCircle,
  CalendarDays,
  Brain,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface DashboardStatus {
  conversas_hoje: number;
  total_conversas: number;
  messages_hoje: number;
  ia_messages_hoje: number;
  agendamentos_hoje: {
    id: string;
    cliente_nome: string;
    servico: string;
    hora_inicio: string;
    status: string;
  }[];
  pendentes: {
    id: string;
    contact_name: string | null;
    last_message_preview: string | null;
    last_message_at: string | null;
  }[];
  resolucao_ia: number;
}

export default function Dashboard() {
  const { profile } = useAccount();
  const navigate = useNavigate();
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [apiError, setApiError] = useState(false);
  const mountedRef = useRef(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const API = import.meta.env.VITE_API_BASE_URL || "/api";

  useEffect(() => {
    if (!profile?.id) return;
    loadAll();
    const interval = setInterval(loadAll, 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [profile?.id]);

  async function loadAll() {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const [statusRes, instRes] = await Promise.all([
        fetch(`${API}/dashboard/status`, { headers, signal: controller.signal }).catch(() => null),
        fetch(`${API}/instances/${profile!.id}`, { headers, signal: controller.signal }).catch(() => null),
      ]);

      clearTimeout(timeout);

      if (!mountedRef.current) return;

      const apiOk = statusRes?.ok || instRes?.ok;

      if (statusRes?.ok) {
        const data = await statusRes.json();
        setStatus(data);
        sessionStorage.setItem("dashboard:status", JSON.stringify(data));
      } else {
        const cached = sessionStorage.getItem("dashboard:status");
        if (cached) setStatus(JSON.parse(cached));
      }

      if (instRes?.ok) {
        const instances = await instRes.json().catch(() => []);
        const conectado = Array.isArray(instances)
          ? instances.some((i: any) => i.connection_status === "connected" || i.connection_state === "open")
          : false;
        setConnected(conectado);
        sessionStorage.setItem("dashboard:connected", String(conectado));
      } else {
        const cached = sessionStorage.getItem("dashboard:connected");
        if (cached) setConnected(cached === "true");
      }

      setApiError(!apiOk && !sessionStorage.getItem("dashboard:connected"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const temConversas = (status?.total_conversas || 0) > 0;
  const temAgendamentosHoje = (status?.agendamentos_hoje?.length || 0) > 0;
  const temPendentes = (status?.pendentes?.length || 0) > 0;
  const temMessages = (status?.messages_hoje || 0) > 0;

  const proximosPassos: { icon: typeof Wifi; title: string; desc: string; action?: string; route?: string }[] = [];

  if (!connected && !apiError) {
    proximosPassos.push({
      icon: Wifi,
      title: "Conectar WhatsApp",
      desc: "Conecte seu WhatsApp para começar a receber mensagens.",
      route: "/configuracoes",
    });
  }

  if (apiError) {
    proximosPassos.push({
      icon: AlertCircle,
      title: "Verificar conexão",
      desc: "Não foi possível verificar o status do sistema. Tente recarregar.",
    });
  }

  if (!temConversas && connected) {
    proximosPassos.push({
      icon: MessageCircle,
      title: "Testar atendimento",
      desc: "Mande uma mensagem para o número conectado e veja a IA responder.",
    });
  }

  if (temPendentes) {
    proximosPassos.push({
      icon: Clock,
      title: `${status!.pendentes.length} conversa(s) pendente(s)`,
      desc: "Clientes aguardando resposta há mais de 2h.",
      route: "/conversas",
    });
  }

  if (temConversas && !temMessages) {
    proximosPassos.push({
      icon: Brain,
      title: "Aguardando interação",
      desc: "O número já tem conversas, mas nenhuma mensagem hoje. Envie algo para testar.",
    });
  }

  if (temConversas && !temAgendamentosHoje) {
    proximosPassos.push({
      icon: CalendarDays,
      title: "Nenhum agendamento hoje",
      desc: "Continue divulgando seu número para gerar agendamentos!",
    });
  }

  if (temAgendamentosHoje) {
    proximosPassos.push({
      icon: CheckCircle2,
      title: `${status!.agendamentos_hoje.length} agendamento(s) hoje`,
      desc: "Clientes com visita agendada para hoje.",
      route: "/agenda",
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {greeting}, {profile?.nome_usuario?.split(" ")[0] ?? profile?.nome?.split(" ")[0] ?? "usuário"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumo do seu atendente inteligente
          </p>
        </div>
        <button
          onClick={loadAll}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
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
            <div className="text-2xl font-bold">{status?.conversas_hoje ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Resolução IA
            </CardTitle>
            <Brain className="w-4 h-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.resolucao_ia ?? 0}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {status?.ia_messages_hoje ?? 0}/{status?.messages_hoje ?? 0} msgs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Users className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.pendentes?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              WhatsApp
            </CardTitle>
            {apiError ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {apiError ? (
                <span className="text-amber-500 text-sm font-normal">Indisponível</span>
              ) : connected ? (
                <span className="text-green-500">Conectado</span>
              ) : (
                <span className="text-muted-foreground">Desconectado</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {proximosPassos.length === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Tudo em ordem!</p>
                <p className="text-xs text-muted-foreground">
                  Seu atendente está funcionando, WhatsApp conectado e conversas fluindo.
                </p>
              </div>
            </div>
          )}

          {proximosPassos.map((passo, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors ${passo.route ? "" : "cursor-default"}`}
              onClick={() => passo.route && navigate(passo.route)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <passo.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{passo.title}</p>
                <p className="text-xs text-muted-foreground">{passo.desc}</p>
              </div>
              {passo.route && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Agenda de hoje</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/agenda")} className="text-xs gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Ver agenda
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {temAgendamentosHoje ? (
            status!.agendamentos_hoje.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{apt.cliente_nome}</p>
                  <p className="text-xs text-muted-foreground">{apt.servico} • {apt.hora_inicio}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${apt.status === "confirmed" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                  {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => navigate("/agenda")}>
              <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nenhuma visita hoje</p>
                <p className="text-xs text-muted-foreground">
                  Clientes podem agendar pelo WhatsApp. Acompanhe pela Agenda.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
