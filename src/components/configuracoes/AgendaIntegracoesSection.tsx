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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Integrações de Agenda</h3>
        <p className="text-xs text-muted-foreground">Conecte seus calendários externos para sincronização automática</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(PROVIDER_INFO) as CalendarProvider[]).map((provider) => {
          const info = PROVIDER_INFO[provider];

          return (
            <Card key={provider} className="border-0 shadow-card bg-card overflow-hidden flex flex-col justify-between opacity-80">
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className={`w-5 h-5 ${info.iconColor}`} />
                    </div>
                    <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-500/20 font-semibold">
                      Em breve
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground">{info.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full text-xs h-8 flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
                  >
                    Em breve
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaIntegracoesSection;
