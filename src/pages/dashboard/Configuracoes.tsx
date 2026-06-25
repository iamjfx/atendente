import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Sparkles, User, XCircle, ChevronRight, ArrowLeft, Bot, Clock, Wrench, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { db } from "@/integrations/db/client";
import { Label } from "@/components/ui/label";
import AgendaIntegracoesSection from "@/components/configuracoes/AgendaIntegracoesSection";
import InstanciasConfig from "@/components/configuracoes/InstanciasConfig";
import IaConfig from "@/components/configuracoes/IaConfig";
import HorariosConfig from "@/components/configuracoes/HorariosConfig";
import CatalogoConfig from "@/components/configuracoes/CatalogoConfig";
import { RAMOS } from "@/lib/ramos";
import { toast } from "sonner";

interface SettingsNavItem {
  value: string;
  label: string;
  description: string;
  icon: any;
  group: string;
}

const NAV_ITEMS: SettingsNavItem[] = [
  { value: "whatsapp", label: "Conexão WhatsApp", description: "QR Code e status de conexão", icon: Smartphone, group: "Canais" },
  { value: "integracoes", label: "Integrações", description: "Agendas e ferramentas", icon: Sparkles, group: "Integrações" },
  { value: "cadastro", label: "Dados Cadastrais", description: "Seus dados e perfil da IA", icon: User, group: "Conta" },
  { value: "comportamento", label: "Comportamento da IA", description: "Autonomia, triagem e instruções", icon: Bot, group: "Conta" },
  { value: "horarios", label: "Horários de Funcionamento", description: "Dias e horários de atendimento", icon: Clock, group: "Conta" },
  { value: "servicos", label: "Serviços", description: "Catálogo de serviços oferecidos", icon: Wrench, group: "Conta" },
  { value: "assinatura", label: "Assinatura", description: "Gerenciamento do plano", icon: XCircle, group: "Conta" },
];

function formatPhoneBR(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return clean.slice(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { profile, refetch } = useAccount();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const [activeTab, setActiveTab] = useState(isMobile ? "menu" : "whatsapp");

  useEffect(() => {
    if (activeTab === "menu" && typeof window !== "undefined" && window.innerWidth >= 1024) {
      setActiveTab("whatsapp");
    }
  }, [activeTab]);

  const navGroups = useMemo(() => ({
    "Canais": NAV_ITEMS.filter((i) => i.group === "Canais"),
    "Integrações": NAV_ITEMS.filter((i) => i.group === "Integrações"),
    "Conta": NAV_ITEMS.filter((i) => i.group === "Conta"),
  }), []);

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [nomeIa, setNomeIa] = useState("");
  const [ramoId, setRamoId] = useState("");
  const [ramoOutro, setRamoOutro] = useState("");
  const [savingCadastros, setSavingCadastros] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNomeUsuario(profile.nome_usuario || profile.nome || "");
    setNomeFantasia(profile.nome_fantasia || "");
    setNomeIa(profile.nome_ia || "");
    setTelefone(profile.telefone || "");
    setCnpjCpf(profile.cnpj_cpf || "");
    setCidade(profile.cidade || "");
    setUf(profile.uf || "");
    setRamoId(profile.ramo_atividade || "");
    setRamoOutro(profile.ramo_outro || "");
  }, [profile]);

  async function handleSaveCadastros() {
    if (!profile?.id) return;
    setSavingCadastros(true);
    try {
      const ramo = RAMOS.find((r) => r.id === ramoId);
      const { error } = await db
        .from("profiles")
        .update({
          nome_usuario: nomeUsuario,
          nome_fantasia: nomeFantasia,
          cnpj_cpf: cnpjCpf || null,
          telefone,
          cidade,
          uf,
          ramo_atividade: ramoId,
          ramo_perfil: ramo?.perfil ?? "generico",
          ramo_outro: ramoId === "outro" ? ramoOutro : null,
          nome_ia: nomeIa,
        })
        .eq("id", profile.id);

      if (error) throw error;
      await refetch();
      toast.success("Informações cadastrais salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar informações.");
    } finally {
      setSavingCadastros(false);
    }
  }

  async function handleCancelSubscription() {
    if (!profile?.id) return;
    if (!confirm("Tem certeza que deseja cancelar sua assinatura do Atendente? Você perderá o acesso à IA de atendimento no WhatsApp.")) return;
    setCanceling(true);
    try {
      const { error } = await db
        .from("account_products")
        .update({ ativo: false })
        .eq("account_id", profile.id)
        .eq("product_slug", "atendente");

      if (error) throw error;
      await refetch();
      toast.success("Assinatura cancelada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar assinatura.");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie as conexões, integrações e dados do Atendente</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {activeTab === "menu" && (
          <div className="lg:hidden w-full space-y-6">
            {Object.entries(navGroups).map(([group, list]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {group}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {list.map((it) => {
                    const Icon = it.icon;
                    return (
                      <div
                        key={it.value}
                        role="button"
                        onClick={() => setActiveTab(it.value)}
                        className="flex items-center justify-between p-4 bg-card hover:bg-muted/40 rounded-xl border border-border/80 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm">{it.label}</p>
                            <p className="text-xs text-muted-foreground">{it.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="hidden lg:flex flex-col w-64 shrink-0 space-y-5 bg-card border rounded-xl p-4 shadow-card">
          {Object.entries(navGroups).map(([group, list]) => (
            <div key={group} className="space-y-1">
              <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/85 mb-1.5">
                {group}
              </h3>
              <div className="space-y-1">
                {list.map((it) => {
                  const Icon = it.icon;
                  const active = it.value === activeTab;
                  return (
                    <button
                      key={it.value}
                      onClick={() => setActiveTab(it.value)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all min-h-[48px] ${
                        active
                          ? "bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-sm"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm leading-none font-medium mb-1">{it.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate leading-none">{it.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {activeTab !== "menu" && (
          <div className="flex-1 min-w-0 space-y-4">
            <div className="lg:hidden mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("menu")}
                className="gap-2 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Configurações
              </Button>
            </div>

            <div className="space-y-6 max-w-2xl w-full">
              {activeTab === "whatsapp" && <InstanciasConfig />}
              {activeTab === "integracoes" && <AgendaIntegracoesSection />}
              {activeTab === "comportamento" && <IaConfig />}
              {activeTab === "horarios" && <HorariosConfig />}
              {activeTab === "servicos" && <CatalogoConfig />}

              {activeTab === "cadastro" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Informações Cadastrais (Onboarding)
                    </CardTitle>
                    <CardDescription>
                      Gerencie as informações da sua conta e do perfil de atendimento da assistente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nomeUsuario">Seu Nome</Label>
                        <Input id="nomeUsuario" value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomeIa">Nome da Assistente IA</Label>
                        <Input id="nomeIa" value={nomeIa} onChange={(e) => setNomeIa(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomeFantasia">Nome Fantasia / Empresa</Label>
                        <Input id="nomeFantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone Comercial (WhatsApp)</Label>
                        <Input id="telefone" value={telefone} onChange={(e) => setTelefone(formatPhoneBR(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpjCpf">CNPJ ou CPF</Label>
                        <Input id="cnpjCpf" value={cnpjCpf} onChange={(e) => setCnpjCpf(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ramoId">Ramo de Atividade</Label>
                        <select
                          id="ramoId"
                          value={ramoId}
                          onChange={(e) => setRamoId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Selecione...</option>
                          {RAMOS.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      {ramoId === "outro" && (
                        <div className="col-span-1 sm:col-span-2 space-y-2">
                          <Label htmlFor="ramoOutro">Descreva sua atividade</Label>
                          <Input id="ramoOutro" value={ramoOutro} onChange={(e) => setRamoOutro(e.target.value)} />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uf">UF</Label>
                        <Input id="uf" value={uf} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="email">Email de Acesso</Label>
                      <Input id="email" defaultValue={user?.email ?? ""} disabled className="opacity-60" />
                      <p className="text-xs text-muted-foreground">
                        O email é usado apenas para login e não pode ser alterado por aqui.
                      </p>
                    </div>

                    <Button className="w-full mt-2" onClick={handleSaveCadastros} disabled={savingCadastros}>
                      {savingCadastros && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === "assinatura" && (
                <Card className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      Zona de Perigo (Assinatura)
                    </CardTitle>
                    <CardDescription className="text-destructive/80 text-xs">
                      Cancele a assinatura do produto Atendente. Seus dados cadastrais e outros produtos contratados permanecerão intactos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" size="sm" onClick={handleCancelSubscription} disabled={canceling} className="rounded-full">
                      {canceling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                      Cancelar Assinatura do Atendente
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
