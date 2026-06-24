import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, Loader2, Smartphone, X, RefreshCw, Sparkles, User, XCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import AgendaIntegracoesSection from "@/components/configuracoes/AgendaIntegracoesSection";
import { RAMOS } from "@/lib/ramos";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface Instance {
  id: string;
  instance_name: string;
  connection_status: string;
  qr_code: string | null;
}

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
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingQr, setFetchingQr] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Controle de Abas (double-responsive navigation from controletotal)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const [activeTab, setActiveTab] = useState(isMobile ? "menu" : "whatsapp");

  useEffect(() => {
    if (activeTab === "menu" && typeof window !== "undefined" && window.innerWidth >= 1024) {
      setActiveTab("whatsapp");
    }
  }, [activeTab]);

  const navGroups = useMemo(() => {
    return {
      "Canais": NAV_ITEMS.filter((i) => i.group === "Canais"),
      "Integrações": NAV_ITEMS.filter((i) => i.group === "Integrações"),
      "Conta": NAV_ITEMS.filter((i) => i.group === "Conta"),
    };
  }, []);

  // Estados de Cadastro
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
      const { error } = await supabase
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
      const { error } = await supabase
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

  useEffect(() => {
    if (!profile?.id) return;
    loadInstance();
  }, [profile?.id]);

  async function loadInstance() {
    setLoading(true);
    const { data } = await supabase
      .from("evolution_instances")
      .select("id, instance_name, connection_status, qr_code")
      .eq("account_id", profile!.id)
      .single();
    if (data) {
      setInstance(data);
      if (data.connection_status === "connecting") {
        fetchQrCode(data.id);
      }
    }
    setLoading(false);
  }

  async function createInstance(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_BASE}/instances/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({ accountId: profile!.id }),
    });

    if (res.status === 409) {
      const { data } = await supabase
        .from("evolution_instances")
        .select("id, instance_name, connection_status, qr_code")
        .eq("account_id", profile!.id)
        .single();
      if (data) {
        setInstance(data);
        return data.id;
      }
      return null;
    }

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    setInstance(data.instance);
    return data.instance.id;
  }

  const fetchQrCode = useCallback(async (instanceId: string) => {
    setFetchingQr(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/instances/${instanceId}/connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const qrBase64 = data.qr_base64 || data.qr_code;
      if (qrBase64) setQrCode(qrBase64);
    } catch (err) {
      console.error("Erro ao buscar QR code:", err);
    } finally {
      setFetchingQr(false);
    }
  }, []);

  async function handleConnect() {
    if (!profile?.id) return;
    let instanceId = instance?.id || null;

    if (!instanceId) {
      instanceId = await createInstance();
    }

    if (!instanceId) return;
    await fetchQrCode(instanceId);

    setInstance((prev) => prev ? { ...prev, connection_status: "connecting" } : prev);
  }

  async function handleDisconnect() {
    if (!instance) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/instances/${instance.id}/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      setInstance({ ...instance, connection_status: "disconnected", qr_code: null });
      setQrCode(null);
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    }
  }

  useEffect(() => {
    if (!instance || instance.connection_status !== "connecting") return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("evolution_instances")
        .select("connection_status, qr_code")
        .eq("id", instance.id)
        .single();
      if (data) {
        setInstance((prev) => prev ? { ...prev, connection_status: data.connection_status } : prev);
        if (data.connection_status === "connected") {
          setQrCode(null);
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [instance?.id, instance?.connection_status]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie as conexões, integrações e dados do Atendente</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Menu Lateral de Navegação (Mobile Cards List quando nenhuma aba está selecionada no mobile) */}
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

        {/* Menu Lateral de Navegação Local no Desktop */}
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

        {/* Área de Conteúdo da Aba Ativa */}
        {activeTab !== "menu" && (
          <div className="flex-1 min-w-0 space-y-4">
            {/* Botão de Voltar no Mobile */}
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
              {activeTab === "whatsapp" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-primary" />
                      WhatsApp
                    </CardTitle>
                    <CardDescription>
                      Conecte o seu número de WhatsApp para que a IA possa responder seus clientes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando conexão...
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          {instance?.connection_status === "connected" ? (
                            <Wifi className="w-5 h-5 text-green-500" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {instance?.connection_status === "connected"
                                ? "Conectado"
                                : instance?.connection_status === "connecting"
                                ? "Conectando..."
                                : "Desconectado"}
                            </p>
                            {instance && (
                              <p className="text-xs text-muted-foreground">{instance.instance_name}</p>
                            )}
                          </div>
                        </div>

                        {instance?.connection_status === "connecting" && (
                          <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
                            {fetchingQr ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Gerando QR code...
                              </div>
                            ) : qrCode ? (
                              <>
                                <img
                                  src={`data:image/png;base64,${qrCode}`}
                                  alt="QR Code WhatsApp"
                                  className="w-48 h-48"
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                  Escaneie o QR code com o WhatsApp do seu número comercial
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setQrCode(null)}
                                  className="rounded-full"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" /> Fechar
                                </Button>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground py-12">QR code indisponível</p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!instance || instance.connection_status === "disconnected" ? (
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={handleConnect}
                              disabled={fetchingQr}
                            >
                              {fetchingQr ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Wifi className="w-3.5 h-3.5 mr-1" />
                              )}
                              {instance ? "Reconectar" : "Conectar WhatsApp"}
                            </Button>
                          ) : instance.connection_status === "connected" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={handleDisconnect}
                            >
                              <WifiOff className="w-3.5 h-3.5 mr-1" />
                              Desconectar
                            </Button>
                          ) : instance.connection_status === "connecting" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => fetchQrCode(instance.id)}
                              disabled={fetchingQr}
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5 mr-1", fetchingQr && "animate-spin")} />
                              Atualizar QR Code
                            </Button>
                          ) : null}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "integracoes" && (
                <AgendaIntegracoesSection />
              )}

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
                        <Input
                          id="nomeUsuario"
                          value={nomeUsuario}
                          onChange={(e) => setNomeUsuario(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomeIa">Nome da Assistente IA</Label>
                        <Input
                          id="nomeIa"
                          value={nomeIa}
                          onChange={(e) => setNomeIa(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomeFantasia">Nome Fantasia / Empresa</Label>
                        <Input
                          id="nomeFantasia"
                          value={nomeFantasia}
                          onChange={(e) => setNomeFantasia(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone Comercial (WhatsApp)</Label>
                        <Input
                          id="telefone"
                          value={telefone}
                          onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpjCpf">CNPJ ou CPF</Label>
                        <Input
                          id="cnpjCpf"
                          value={cnpjCpf}
                          onChange={(e) => setCnpjCpf(e.target.value)}
                        />
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
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {ramoId === "outro" && (
                        <div className="col-span-1 sm:col-span-2 space-y-2">
                          <Label htmlFor="ramoOutro">Descreva sua atividade</Label>
                          <Input
                            id="ramoOutro"
                            value={ramoOutro}
                            onChange={(e) => setRamoOutro(e.target.value)}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uf">UF</Label>
                        <Input
                          id="uf"
                          value={uf}
                          maxLength={2}
                          onChange={(e) => setUf(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="email">Email de Acesso</Label>
                      <Input id="email" defaultValue={user?.email ?? ""} disabled className="opacity-60" />
                      <p className="text-xs text-muted-foreground">
                        O email é usado apenas para login e não pode ser alterado por aqui.
                      </p>
                    </div>

                    <Button
                      className="w-full mt-2"
                      onClick={handleSaveCadastros}
                      disabled={savingCadastros}
                    >
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="rounded-full"
                    >
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
