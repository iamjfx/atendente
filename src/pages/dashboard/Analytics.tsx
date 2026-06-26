import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageCircle, Brain, Clock, CalendarDays, MapPin, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  conversas: { total: number; resolvidas_ia: number; percentual_ia: number };
  mensagens: { total: number; ia: number; manual: number; resolucao_ia: number };
  tempo_resposta_segundos: number;
  agendamentos: { total: number; servicos: { servico: string; total: number }[] };
  horarios: { hora: string; dia: string; total: number }[];
  regioes: { cidade: string; uf: string; total: number }[];
  evolucao_diaria: { data: string; total: number }[];
}

const COLORS = ["#1a56db", "#30D158", "#FF9F0A", "#FF375F", "#5E5CE6", "#AC39FF", "#FF6482", "#00C7BE"];

export default function Analytics() {
  const { session } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.access_token) return;
    setLoading(true);
    fetch("/api/analytics/geral", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-sm text-destructive">
        Erro ao carregar analytics: {error}
      </div>
    );
  }

  if (!data) return null;

  const tempoStr = data.tempo_resposta_segundos > 60
    ? `${Math.round(data.tempo_resposta_segundos / 60)}min`
    : `${data.tempo_resposta_segundos}s`;

  return (
    <div className="space-y-6 max-w-5xl p-4 md:p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Métricas dos últimos 30 dias</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-3 px-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> Conversas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{data.conversas.total}</div>
            <p className="text-[10px] text-muted-foreground">{data.conversas.percentual_ia}% resolvidas pela IA</p>
          </CardContent>
        </Card>

        <Card className="py-3 px-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3 text-violet-500" /> Resolução IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{data.mensagens.resolucao_ia}%</div>
            <p className="text-[10px] text-muted-foreground">{data.mensagens.ia}/{data.mensagens.total} msgs</p>
          </CardContent>
        </Card>

        <Card className="py-3 px-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Tempo resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{tempoStr}</div>
            <p className="text-[10px] text-muted-foreground">médio</p>
          </CardContent>
        </Card>

        <Card className="py-3 px-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-green-500" /> Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{data.agendamentos.total}</div>
            <p className="text-[10px] text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Conversas por dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.evolucao_diaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#1a56db" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Services ranking */}
      {data.agendamentos.servicos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Serviços mais agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.agendamentos.servicos.map((s, i) => (
                <div key={s.servico} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="truncate">{s.servico}</span>
                      <span className="font-semibold">{s.total}x</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(s.total / Math.max(...data.agendamentos.servicos.map((x) => x.total))) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regions */}
      {data.regioes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Regiões dos clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.regioes.slice(0, 10).map((r) => (
                <div key={`${r.cidade}-${r.uf}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-xs">{r.cidade}{r.uf ? ` - ${r.uf}` : ""}</span>
                  <span className="text-xs font-semibold">{r.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
