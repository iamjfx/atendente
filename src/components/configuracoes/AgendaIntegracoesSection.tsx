import { useState } from "react";
import { Calendar, Check, Loader2, ExternalLink, ShieldCheck, Mail, Lock, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCalendarIntegration, type CalendarProvider } from "@/hooks/useCalendarIntegration";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PROVIDER_INFO = {
  google_calendar: {
    name: "Google Calendar",
    desc: "Sincronize com o Google Calendar pessoal ou do Workspace.",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    iconColor: "text-blue-500",
  },
  icloud_calendar: {
    name: "iCloud Calendar",
    desc: "Sincronize com seu calendário da Apple usando CalDAV.",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    iconColor: "text-purple-500",
  },
  outlook_calendar: {
    name: "Outlook / Office 365",
    desc: "Sincronize com contas Microsoft corporativas ou pessoais.",
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    iconColor: "text-sky-500",
  },
};

const PALETTE_COLORS = [
  { value: "#1a5fb4", label: "Azul" },
  { value: "#b8050f", label: "Vermelho" },
  { value: "#2ec27e", label: "Verde" },
  { value: "#e5a50a", label: "Amarelo" },
  { value: "#9141ac", label: "Roxo" },
];

const AgendaIntegracoesSection = () => {
  const { integrations, preferences, loading, savePreferences, connect, disconnect } =
    useCalendarIntegration();

  const [connectingProvider, setConnectingProvider] = useState<CalendarProvider | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Open modal to configure/connect
  const handleStartConnect = (provider: CalendarProvider) => {
    setEmailInput("");
    setPasswordInput("");
    setConnectingProvider(provider);
  };

  const handleSaveConnection = async () => {
    if (!connectingProvider) return;
    if (!emailInput) {
      toast.error("E-mail obrigatório", {
        description: "Por favor, informe seu e-mail da conta.",
      });
      return;
    }

    if (connectingProvider === "icloud_calendar" && !passwordInput) {
      toast.error("Senha de aplicativo obrigatória", {
        description: "A Apple exige uma senha de aplicativo para conexões de terceiros.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await connect(connectingProvider, emailInput, { password: passwordInput });
      setConnectingProvider(null);
    } catch (e: any) {
      toast.error("Erro ao conectar", {
        description: e.message || "Tente novamente mais tarde.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (provider: CalendarProvider) => {
    if (!confirm(`Tem certeza que deseja desconectar o ${PROVIDER_INFO[provider].name}?`)) return;
    try {
      await disconnect(provider);
    } catch (e: any) {
      toast.error("Erro ao desconectar", {
        description: e.message || "Tente novamente mais tarde.",
      });
    }
  };

  if (loading && !connectingProvider) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const anyConnected = Object.values(integrations).some((i) => i !== null);

  return (
    <div className="space-y-6">
      {/* Cards de Integrações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(PROVIDER_INFO) as CalendarProvider[]).map((provider) => {
          const info = PROVIDER_INFO[provider];
          const integration = integrations[provider];
          const active = !!integration;

          return (
            <Card key={provider} className="border-0 shadow-card bg-card overflow-hidden flex flex-col justify-between">
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className={`w-5 h-5 ${info.iconColor}`} />
                    </div>
                    {active ? (
                      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-border/80">
                        Inativo
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground">{info.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
                  </div>
                </div>

                <div className="pt-2">
                  {active ? (
                    <div className="space-y-3">
                      <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                        <p className="text-xs font-medium text-foreground truncate">{integration.account_email}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Sincronizando desde {new Date(integration.conectado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(provider)}
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 text-xs h-8"
                      >
                        Desconectar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartConnect(provider)}
                      className="w-full text-xs h-8 flex items-center justify-center gap-1.5"
                    >
                      Configurar
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Painel de Configurações da Sincronização */}
      {anyConnected && (
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Configurações da Sincronização de Agenda
            </CardTitle>
            <CardDescription>
              Ajuste as preferências de sincronização de agendamentos com os calendários conectados.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Auto Sync */}
            <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div>
                <Label className="font-semibold text-sm">Enviar novos agendamentos automaticamente</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Novos serviços marcados no Atendente serão espelhados em tempo real na sua agenda externa.
                </p>
              </div>
              <Switch
                checked={preferences.sincronizar_automaticamente}
                onCheckedChange={(v) => savePreferences({ sincronizar_automaticamente: v })}
              />
            </div>

            {/* Custom Calendar Name */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0">
              <div className="space-y-0.5">
                <Label className="font-semibold text-sm">Nome do calendário na agenda</Label>
                <p className="text-xs text-muted-foreground">
                  Sub-calendário criado na sua conta para agrupar os compromissos.
                </p>
              </div>
              <Input
                value={preferences.nome_calendario}
                onChange={(e) => savePreferences({ nome_calendario: e.target.value })}
                className="max-w-xs h-9 text-sm"
                placeholder="Atendente"
              />
            </div>

            {/* Buffer time */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0">
              <div className="space-y-0.5">
                <Label className="font-semibold text-sm">Tempo de bloqueio pós-atendimento</Label>
                <p className="text-xs text-muted-foreground">
                  Tempo adicional (em minutos) adicionado no final de cada compromisso na agenda externa.
                </p>
              </div>
              <Input
                type="number"
                value={preferences.tempo_bloqueio}
                onChange={(e) => savePreferences({ tempo_bloqueio: Number(e.target.value) })}
                className="max-w-[120px] h-9 text-sm"
                min={0}
                step={5}
              />
            </div>

            {/* Color Category */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0">
              <div className="space-y-0.5">
                <Label className="font-semibold text-sm">Cor padrão dos eventos</Label>
                <p className="text-xs text-muted-foreground">
                  Cor visual que os eventos gerados pelo Atendente terão no seu calendário.
                </p>
              </div>
              <div className="flex gap-2">
                {PALETTE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => savePreferences({ cor_compromisso: color.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center`}
                    style={{
                      backgroundColor: color.value,
                      borderColor: preferences.cor_compromisso === color.value ? "var(--foreground)" : "transparent",
                    }}
                    title={color.label}
                  >
                    {preferences.cor_compromisso === color.value && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Conexão */}
      <Dialog open={!!connectingProvider} onOpenChange={(v) => !v && setConnectingProvider(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Integrar com {connectingProvider ? PROVIDER_INFO[connectingProvider].name : ""}
            </DialogTitle>
            <DialogDescription>
              Insira as credenciais abaixo para conectar sua agenda externa de forma segura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {connectingProvider === "icloud_calendar" && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-3 text-xs leading-relaxed space-y-1">
                <p className="font-semibold">⚠️ Requisito do iCloud Calendar:</p>
                <p>
                  Para conectar o iCloud, você deve utilizar o seu ID Apple e uma **Senha de Aplicativo**
                  exclusiva.
                </p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Acesse appleid.apple.com e faça login.</li>
                  <li>Vá em Login e Segurança &gt; Senhas de Aplicativo.</li>
                  <li>Clique em Gerar senha de aplicativo e copie-a.</li>
                </ol>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="calendar-email" className="text-sm font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                E-mail da Conta
              </Label>
              <Input
                id="calendar-email"
                type="email"
                placeholder={
                  connectingProvider === "google_calendar"
                    ? "seuemail@gmail.com"
                    : connectingProvider === "icloud_calendar"
                    ? "seu-id-apple@icloud.com"
                    : "seuemail@outlook.com"
                }
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {connectingProvider === "icloud_calendar" && (
              <div className="space-y-2">
                <Label htmlFor="calendar-pass" className="text-sm font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Senha de Aplicativo (App-Specific Password)
                </Label>
                <Input
                  id="calendar-pass"
                  type="password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="h-10 text-sm font-mono"
                />
              </div>
            )}

            {connectingProvider !== "icloud_calendar" && (
              <div className="flex items-center gap-2 bg-muted/40 p-3 rounded-lg border border-border/40 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>O Atendente utiliza autenticação oficial OAuth para garantir a máxima segurança dos seus dados.</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConnectingProvider(null)} className="h-9 text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSaveConnection} disabled={submitting} className="h-9 text-xs">
              {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Conectar Conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaIntegracoesSection;
