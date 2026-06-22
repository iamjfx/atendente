import { useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle,
  Users,
  CalendarDays,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Briefcase,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Stats {
  conversasHoje: number;
  mensagensNaoLidas: number;
  totalClientes: number;
  evolutionConectado: boolean;
}

interface Budget {
  id: string;
  cliente_nome: string;
  telefone: string | null;
  servico: string;
  descricao: string | null;
  valor: number;
  status: string;
  created_at: string;
  aprovado_em: string | null;
}

const STAGES = [
  { id: "pendente", label: "Leads Qualificados", color: "border-t-blue-500 bg-blue-500/5 text-blue-600" },
  { id: "em_andamento", label: "Em Negociação", color: "border-t-amber-500 bg-amber-500/5 text-amber-600" },
  { id: "aprovado", label: "Aprovados (Ganho)", color: "border-t-green-500 bg-green-500/5 text-green-600" },
  { id: "recusado", label: "Recusados (Perdido)", color: "border-t-red-500 bg-red-500/5 text-red-600" },
];

export default function Dashboard() {
  const { profile } = useAccount();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    conversasHoje: 0,
    mensagensNaoLidas: 0,
    totalClientes: 0,
    evolutionConectado: false,
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hasControleTotal, setHasControleTotal] = useState(false);
  const [loading, setLoading] = useState(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  useEffect(() => {
    if (!profile?.id) return;
    loadDashboardData();
  }, [profile?.id]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const accountId = profile!.id;
      
      // 1. Check if user also has Controle Total active
      const { data: ctProduct } = await supabase
        .from("account_products")
        .select("ativo")
        .eq("account_id", accountId)
        .eq("product_slug", "controletotal")
        .maybeSingle();
      
      const integrated = !!ctProduct?.ativo;
      setHasControleTotal(integrated);

      // 2. Fetch standalone stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        { count: conversasHoje },
        { count: mensagensNaoLidas },
        { count: totalClientes },
        { data: instances },
        { data: budgetsData }
      ] = await Promise.all([
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("account_id", accountId)
          .gte("last_message_at", todayStart.toISOString()),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("account_id", accountId)
          .gt("unread_count", 0),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("account_id", accountId),
        supabase
          .from("evolution_instances")
          .select("connection_status")
          .eq("account_id", accountId),
        supabase
          .from("orcamentos")
          .select("*")
          .eq("user_id", accountId)
          .order("created_at", { ascending: false })
      ]);

      setStats({
        conversasHoje: conversasHoje ?? 0,
        mensagensNaoLidas: mensagensNaoLidas ?? 0,
        totalClientes: totalClientes ?? 0,
        evolutionConectado: instances?.some((i) => i.connection_status === "connected") ?? false,
      });

      if (budgetsData) {
        setBudgets(budgetsData as Budget[]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Update budget stage
  async function updateBudgetStatus(budgetId: string, newStatus: string) {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === "aprovado") {
        updateData.aprovado_em = new Date().toISOString();
      } else {
        updateData.aprovado_em = null;
      }

      const { error } = await supabase
        .from("orcamentos")
        .update(updateData)
        .eq("id", budgetId);

      if (error) throw error;

      setBudgets((prev) =>
        prev.map((b) => (b.id === budgetId ? { ...b, ...updateData } : b))
      );

      if (newStatus === "aprovado") {
        toast.success("Orçamento aprovado! Mensagem de pós-venda agendada para 24h.");
      } else {
        toast.success("Status atualizado com sucesso!");
      }
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  }

  const formatBRL = (v: number) =>
    (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Group budgets by stage
  const getBudgetsByStage = (stageId: string) => {
    return budgets.filter((b) => b.status === stageId || (stageId === "pendente" && !b.status));
  };

  // Calculate sum value per stage
  const getStageTotalValue = (stageId: string) => {
    const list = getBudgetsByStage(stageId);
    return list.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {greeting}, {profile?.nome_usuario?.split(" ")[0] ?? profile?.nome?.split(" ")[0] ?? "usuário"} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasControleTotal 
              ? "Resumo do seu assistente com integração ativa ao Controle Total"
              : "Gerencie seus contatos qualificados e funil de vendas do Atendente"
            }
          </p>
        </div>

        {hasControleTotal && (
          <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/20 shadow-sm animate-pulse">
            <TrendingUp className="w-4 h-4" /> Integração Controle Total Ativa
          </span>
        )}
      </div>

      {/* 4 Cards Row: Standalone stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Conversas Hoje
            </CardTitle>
            <MessageCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{stats.conversasHoje}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Mensagens não lidas
            </CardTitle>
            <Users className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-destructive">
              {stats.mensagensNaoLidas}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Total Contatos
            </CardTitle>
            <CalendarDays className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{stats.totalClientes}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              WhatsApp Link
            </CardTitle>
            {stats.evolutionConectado ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold flex items-center gap-2">
              <span className={stats.evolutionConectado ? "text-green-500" : "text-muted-foreground"}>
                {stats.evolutionConectado ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTAINER: KANBAN FOR STANDALONE OR EDUCATION FOR INTEGRATED */}
      {hasControleTotal ? (
        /* Integrated mode: Redirect to Controle Total */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 bg-card/60 backdrop-blur-md shadow-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Funil de Vendas & Leads Integrado
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Excelente! Você possui uma assinatura ativa do <strong>Controle Total</strong> e as ferramentas estão integradas de forma inteligente.
              </p>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-foreground/80 space-y-2 leading-relaxed">
                <p>💡 <strong>Como funciona a automação:</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                  <li>Sua IA Atendente conversa e recolhe dados do lead no WhatsApp.</li>
                  <li>Assim que o lead é qualificado, o Atendente cria a proposta na tabela do Controle Total.</li>
                  <li>Gerencie todos esses orçamentos diretamente no painel do <strong>Controle Total</strong> na aba <em>Orçamentos</em>.</li>
                  <li>O pós-venda automático de 24h é disparado no WhatsApp assim que o status for aprovado lá.</li>
                </ul>
              </div>
            </div>

            <Button
              className="mt-6 w-full sm:w-auto self-start gap-2"
              onClick={() => window.open(import.meta.env.VITE_CONTROLE_TOTAL_URL || "http://localhost:5173", "_blank")}
            >
              Acessar Painel Controle Total <ExternalLink className="w-4 h-4" />
            </Button>
          </Card>

          <Card className="hover:shadow-md transition-all duration-300">
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
                  <p className="text-sm font-medium">WhatsApp Link</p>
                  <p className="text-xs text-muted-foreground">Configure a conexão do número comercial.</p>
                </div>
              </div>
              <div
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate("/conversas")}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Histórico de Conversas</p>
                  <p className="text-xs text-muted-foreground">Monitore os atendimentos em tempo real.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Standalone mode: Show the premium Kanban CRM pipeline board */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Pipeline CRM (Funil de Leads)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Mova os leads qualificados pela IA até fechar o serviço</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadDashboardData} className="text-xs font-semibold gap-1.5 h-8">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Atualizar Funil
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageList = getBudgetsByStage(stage.id);
              const totalVal = getStageTotalValue(stage.id);

              return (
                <div key={stage.id} className={`rounded-xl border border-border/80 flex flex-col h-full min-h-[480px] p-3 ${stage.color.split(" ")[1]}`}>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{stage.label}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{stageList.length} items</p>
                    </div>
                    <span className="text-xs font-bold text-foreground bg-card px-2 py-0.5 rounded border">
                      {formatBRL(totalVal)}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {stageList.length === 0 ? (
                      <div className="h-40 border border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4">
                        <Clock className="w-6 h-6 text-muted-foreground/30 mb-2" />
                        <p className="text-[10px] text-muted-foreground">Nenhum lead nesta etapa</p>
                      </div>
                    ) : (
                      stageList.map((item) => (
                        <Card key={item.id} className="border bg-card shadow-sm hover:shadow transition-all group overflow-hidden">
                          <CardHeader className="p-3 pb-1">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="text-xs font-bold text-foreground truncate max-w-[130px]">
                                {item.cliente_nome}
                              </h5>
                              <span className="text-[10px] font-bold text-primary shrink-0">
                                {formatBRL(item.valor)}
                              </span>
                            </div>
                            <CardDescription className="text-[10px] truncate mt-0.5">
                              {item.servico}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 pt-1 space-y-2">
                            {item.descricao && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-1.5 rounded">
                                {item.descricao}
                              </p>
                            )}

                            <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-1 border-t">
                              <span>
                                {new Date(item.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>

                              {/* Action controls */}
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
                                {stage.id !== "pendente" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-5 h-5"
                                    onClick={() => {
                                      const idx = STAGES.findIndex((s) => s.id === stage.id);
                                      if (idx > 0) updateBudgetStatus(item.id, STAGES[idx - 1].id);
                                    }}
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </Button>
                                )}

                                {stage.id === "em_andamento" && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="w-5 h-5 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                      onClick={() => updateBudgetStatus(item.id, "aprovado")}
                                      title="Aprovar/Ganhar"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="w-5 h-5 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                      onClick={() => updateBudgetStatus(item.id, "recusado")}
                                      title="Recusar/Perder"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}

                                {stage.id !== "recusado" && stage.id !== "aprovado" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-5 h-5"
                                    onClick={() => {
                                      const idx = STAGES.findIndex((s) => s.id === stage.id);
                                      if (idx < STAGES.length - 1) updateBudgetStatus(item.id, STAGES[idx + 1].id);
                                    }}
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
