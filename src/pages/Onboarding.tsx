import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RAMOS, getRamoById } from "@/lib/ramos";
import { cn } from "@/lib/utils";
import {
  Search, Hammer, Wrench, Sparkles, Heart, BookOpen,
  Palette, Music, PawPrint, Building2, Loader2,
  CheckCircle2, ArrowRight, ArrowLeft, Smartphone, Wifi,
  RefreshCw, Lock, ShieldCheck, EyeOff, ClipboardCheck,
  User, Building, MessageSquareQuote, Check
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const CATEGORIA_ICONE: Record<string, { icon: any; cor: string; bg: string }> = {
  "Obras e Reformas": { icon: Hammer, cor: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  "Serviços": { icon: Wrench, cor: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  "Beleza e Bem-estar": { icon: Sparkles, cor: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  "Saúde": { icon: Heart, cor: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  "Educação": { icon: BookOpen, cor: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  "Criativo e Consultoria": { icon: Palette, cor: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
  "Eventos": { icon: Music, cor: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  "Pet": { icon: PawPrint, cor: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20" },
  "Outro": { icon: Building2, cor: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20" },
};

function formatPhoneBR(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return clean.slice(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export default function Onboarding() {
  const { signOut } = useAuth();
  const { profile, refetch } = useAccount();
  const navigate = useNavigate();

  // Multi-step logic (Apple style: 5 clear, smaller steps)
  // 1: Personal profile details
  // 2: Business Profile (Ramo & Info)
  // 3: IA Assistant Persona
  // 4: WhatsApp Sync
  // 5: Privacy/LGPD Consent
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [nomeIa, setNomeIa] = useState("");

  // Ramo selection
  const [buscaRamo, setBuscaRamo] = useState("");
  const [ramoId, setRamoId] = useState<string | null>(null);
  const [ramoOutro, setRamoOutro] = useState("");

  // WhatsApp Sync State
  const [instance, setInstance] = useState<any>(null);
  const [fetchingQr, setFetchingQr] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // LGPD consent state
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNomeUsuario(profile.nome_usuario || profile.nome || "");
    setNomeFantasia(profile.nome_fantasia || "");
    setNomeIa(profile.nome_ia || "");
  }, [profile]);

  const filterRamos = RAMOS.filter((r) =>
    r.label.toLowerCase().includes(buscaRamo.toLowerCase()) ||
    r.categoria.toLowerCase().includes(buscaRamo.toLowerCase())
  );

  async function createInstance(accountId: string): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_BASE}/instances/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({ accountId }),
    });

    if (res.status === 409) {
      const { data } = await supabase
        .from("evolution_instances")
        .select("id, instance_name, connection_status, qr_code")
        .eq("account_id", accountId)
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
      toast.error("Erro ao gerar o QR Code. Tente atualizar.");
    } finally {
      setFetchingQr(false);
    }
  }, []);

  useEffect(() => {
    if (step !== 4 || !instance || instance.connection_status === "connected") return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("evolution_instances")
        .select("connection_status, qr_code")
        .eq("id", instance.id)
        .single();

      if (data) {
        setInstance((prev: any) => prev ? { ...prev, connection_status: data.connection_status } : prev);
        if (data.connection_status === "connected") {
          setQrCode(null);
          toast.success("WhatsApp Conectado com sucesso!");
          clearInterval(interval);
          setStep(5);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, instance?.id, instance?.connection_status]);

  async function handleStartWhatsAppConnection() {
    if (!profile?.id) return;
    setFetchingQr(true);
    try {
      const instanceId = await createInstance(profile.id);
      if (instanceId) {
        await fetchQrCode(instanceId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao preparar conexão.");
    } finally {
      setFetchingQr(false);
    }
  }

  async function handleSaveProfiles() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const ramo = getRamoById(ramoId);
      let { error } = await supabase
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
          onboarding_etapa: 1,
        })
        .eq("id", profile.id);

      if (error) {
        if (error.message?.includes("nome_ia") || error.message?.includes("schema cache") || error.code === "PGRST204") {
          const fallbackRes = await supabase
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
              onboarding_etapa: 1,
            })
            .eq("id", profile.id);

          if (fallbackRes.error) throw fallbackRes.error;
          toast.warning("Informações salvas com avisos.");
        } else {
          throw error;
        }
      } else {
        toast.success("Informações de perfil gravadas!");
      }
      setStep(4);
      await handleStartWhatsAppConnection();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishOnboarding() {
    if (!profile?.id) return;
    if (!lgpdAccepted) {
      toast.error("Você precisa aceitar os termos de uso e privacidade.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_completo: true,
          lgpd_aceito_em: new Date().toISOString(),
          lgpd_versao_privacidade: "1.0",
          lgpd_versao_termos: "1.0"
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refetch();
      toast.success("Boas-vindas ao Atendente!");
      navigate("/admin", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao concluir cadastro.");
    } finally {
      setLoading(false);
    }
  }

  const stepsLabel = [
    { num: 1, label: "Sobre Você" },
    { num: 2, label: "Seu Negócio" },
    { num: 3, label: "Sua Assistente" },
    { num: 4, label: "Conexão" },
    { num: 5, label: "Segurança" },
  ];

  return (
    <div className="h-screen bg-[#fafafa] dark:bg-[#09090b] flex flex-col justify-between font-sans antialiased text-neutral-800 dark:text-neutral-200 overflow-hidden">
      
      {/* Header com Design Minimalista Apple */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neutral-950 dark:bg-white flex items-center justify-center shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 13.5C6 10.462 8.462 8 11.5 8H12.5C15.538 8 18 10.462 18 13.5C18 16.538 15.538 19 12.5 19H11.5C10.5 19 9.5 18.5 9 18L6 19L7 16.5C6.5 15.8 6 14.8 6 13.5Z" className="fill-white dark:fill-black" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">Atendente</span>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
          className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Sair da conta
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-4 flex flex-col justify-center min-h-0">
        
        {/* Progress Bar Minimalist */}
        <div className="mb-4 shrink-0">
          <div className="flex justify-between text-[10px] font-medium text-neutral-400 mb-1.5">
            <span>Passo {step} de 5</span>
            <span className="text-neutral-800 dark:text-neutral-300 font-semibold">{stepsLabel[step - 1].label}</span>
          </div>
          <div className="h-[2px] bg-neutral-100 dark:bg-neutral-800 rounded-full w-full overflow-hidden flex">
            {stepsLabel.map((s) => (
              <div
                key={s.num}
                className={cn(
                  "h-full flex-1 transition-all duration-300 border-r border-[#fafafa] dark:border-[#09090b] last:border-0",
                  step >= s.num ? "bg-neutral-950 dark:bg-white" : "bg-transparent"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content Card with Smooth Transitions */}
        <div className="bg-white dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-0 flex flex-col justify-between overflow-y-auto max-h-[72vh]">
          
          {/* STEP 1: SOBRE VOCÊ */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  <User className="w-3.5 h-3.5" /> Boas-vindas
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Qual é o seu nome?</h1>
                <p className="text-sm text-neutral-500">
                  Para iniciarmos, nos diga como você gostaria de ser chamado na plataforma.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeUsuario" className="text-xs font-medium text-neutral-500">Seu nome completo ou apelido</Label>
                  <Input
                    id="nomeUsuario"
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="h-12 px-4 rounded-xl border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 bg-neutral-50/50 dark:bg-neutral-900/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!nomeUsuario.trim()}
                  className="rounded-xl px-6 h-12 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-2 transition-all font-semibold text-sm"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SEU NEGÓCIO & RAMO DE ATIVIDADE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  <Building className="w-3 h-3" /> Negócio
                </span>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Detalhes do seu negócio</h1>
                <p className="text-xs text-neutral-500">
                  Insira as informações de atendimento da sua empresa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeFantasia" className="text-xs font-medium text-neutral-500">Nome Fantasia ou Empresa</Label>
                  <Input
                    id="nomeFantasia"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Clínica Sorriso Perfeito"
                    className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-xs font-medium text-neutral-500">Telefone Comercial (WhatsApp)</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cnpjCpf" className="text-xs font-medium text-neutral-500">CNPJ ou CPF (Opcional)</Label>
                  <Input
                    id="cnpjCpf"
                    value={cnpjCpf}
                    onChange={(e) => setCnpjCpf(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="cidade" className="text-xs font-medium text-neutral-500">Cidade</Label>
                    <Input
                      id="cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="uf" className="text-xs font-medium text-neutral-500">UF</Label>
                    <Input
                      id="uf"
                      value={uf}
                      maxLength={2}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Ramo de atividade selector moderno */}
              <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                <Label className="text-xs font-semibold text-neutral-500">Selecione seu Ramo de Atividade</Label>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <Input
                    value={buscaRamo}
                    onChange={(e) => setBuscaRamo(e.target.value)}
                    placeholder="Buscar atividade..."
                    className="pl-9 h-9 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {filterRamos.map((r) => {
                    const selected = ramoId === r.id;
                    const meta = CATEGORIA_ICONE[r.categoria] || CATEGORIA_ICONE["Outro"];
                    const Icone = meta.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRamoId(r.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold text-left transition-all duration-200 hover:scale-[1.01]",
                          selected
                            ? "border-neutral-900 dark:border-white bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm"
                            : "border-neutral-200/70 dark:border-neutral-800 bg-white dark:bg-[#121214] hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        )}
                      >
                        <div className={cn("p-1 rounded-lg shrink-0", selected ? "bg-white/10" : meta.bg)}>
                          <Icone className={cn("w-3.5 h-3.5", selected ? "text-white dark:text-neutral-950" : meta.cor)} />
                        </div>
                        <span className="flex-1 truncate text-[11px]">{r.label}</span>
                        {selected && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {ramoId === "outro" && (
                  <div className="space-y-1.5 mt-1 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs font-semibold text-neutral-500">Descreva sua atividade</Label>
                    <Input
                      value={ramoOutro}
                      onChange={(e) => setRamoOutro(e.target.value)}
                      placeholder="Ex: Confeitaria, Estúdio de Pilates..."
                      className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl px-4 h-10 border-neutral-200 dark:border-neutral-800 gap-1.5 font-medium text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!ramoId || !nomeFantasia.trim() || !telefone.trim() || !cidade.trim() || !uf.trim() || (ramoId === "outro" && !ramoOutro.trim())}
                  className="rounded-xl px-5 h-10 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-1.5 transition-all font-semibold text-xs"
                >
                  Continuar
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: NOME DA ASSISTENTE IA */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  <MessageSquareQuote className="w-3 h-3" /> IA Assistente
                </span>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Nome da sua Recepcionista</h1>
                <p className="text-xs text-neutral-500">
                  Dê um nome para a inteligência artificial que fará os agendamentos e responderá seus clientes no WhatsApp.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeIa" className="text-xs font-medium text-neutral-500">Nome da assistente virtual</Label>
                  <div className="relative">
                    <Input
                      id="nomeIa"
                      value={nomeIa}
                      onChange={(e) => setNomeIa(e.target.value)}
                      placeholder="Ex: Júlia, Clara, Carol..."
                      className="h-11 px-4 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 font-medium text-xs"
                    />
                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl px-4 h-10 border-neutral-200 dark:border-neutral-800 gap-1.5 font-medium text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSaveProfiles}
                  disabled={!nomeIa.trim() || loading}
                  className="rounded-xl px-5 h-10 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-1.5 transition-all font-semibold text-xs"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar e Configurar WhatsApp
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: CONEXÃO WHATSAPP (QR CODE) */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  <Smartphone className="w-3.5 h-3.5" /> Conexão
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Conecte o seu WhatsApp</h1>
                <p className="text-base text-neutral-500">
                  Vincule seu número comercial para ativar o atendimento da sua nova IA {nomeIa ? `(${nomeIa})` : ""}.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/20 min-h-[320px]">
                {fetchingQr ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="w-9 h-9 animate-spin text-neutral-900 dark:text-white" />
                    <p className="text-base text-neutral-400">Preparando pareamento seguro...</p>
                  </div>
                ) : qrCode ? (
                  <div className="flex flex-col items-center gap-6 text-center w-full">
                    <div className="relative group p-4 bg-white dark:bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-neutral-100">
                      <img
                        src={`data:image/png;base64,${qrCode}`}
                        alt="QR Code WhatsApp"
                        className="w-52 h-52"
                      />
                    </div>
                    
                    <div className="space-y-4 max-w-lg bg-white dark:bg-[#1a1a1e] border border-neutral-100 dark:border-neutral-900 p-6 rounded-2xl text-left">
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Como parear seu celular:</p>
                      <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-2.5 list-decimal pl-5">
                        <li>Abra o WhatsApp no celular comercial</li>
                        <li>Vá nas Configurações &gt; <strong>Aparelhos Conectados</strong></li>
                        <li>Selecione <strong>Conectar um aparelho</strong> e aponte para o QR Code.</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => fetchQrCode(instance.id)}
                        disabled={fetchingQr}
                        className="rounded-xl h-11 px-5 text-sm"
                      >
                        <RefreshCw className={cn("w-4 h-4 mr-2", fetchingQr && "animate-spin")} />
                        Gerar novo QR Code
                      </Button>
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={() => setStep(5)}
                        className="rounded-xl h-11 text-sm text-neutral-400 hover:text-neutral-900"
                      >
                        Conectar mais tarde
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5 text-center py-8">
                    <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Wifi className="w-7 h-7 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">Instância desconectada</p>
                      <p className="text-sm text-neutral-400 max-w-sm mt-1.5">
                        Gere um código seguro e conecte seu número para iniciar a inteligência de agendamentos.
                      </p>
                    </div>
                    <Button
                      onClick={handleStartWhatsAppConnection}
                      disabled={fetchingQr}
                      className="rounded-xl px-6 h-12 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 gap-2 text-sm font-semibold"
                    >
                      <Wifi className="w-4 h-4" />
                      Gerar QR Code
                    </Button>
                  </div>
                )}
              </div>

              {instance?.connection_status === "connecting" && (
                <div className="flex items-center gap-2 justify-center text-xs text-neutral-400 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Aguardando leitura do QR Code pelo WhatsApp...
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-neutral-100 dark:border-neutral-900">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="rounded-xl px-5 h-11 border-neutral-200 dark:border-neutral-800 gap-2 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  variant="ghost"
                  className="rounded-xl gap-2 font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Pular etapa por enquanto
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: SEGURANÇA E PRIVACIDADE (BLINDAGEM JURÍDICA / LGPD) */}
          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                  <Lock className="w-3.5 h-3.5" /> Segurança dos Dados
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Privacidade em Primeiro Lugar</h1>
                <p className="text-sm text-neutral-500">
                  Como provedora técnica de agendamentos automatizados, nosso compromisso é com a segurança das suas mensagens.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 flex gap-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Isolamento e Segurança de Mensagens</h3>
                    <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      A IA atua estritamente nas mensagens recebidas no seu número e iniciadas por clientes. Conversas pessoais, conversas com outros contatos iniciadas por você, e chats de grupos são ignorados ativamente e não são processados.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 flex gap-4">
                  <EyeOff className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Não Armazenamento de Arquivos e Conversas</h3>
                    <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Não coletamos fotos, mídias ou arquivos pessoais do seu WhatsApp. Transcrições de mensagens de voz são efetuadas temporariamente em memória para inteligência de resposta, sem persistência nos servidores.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 flex gap-4">
                  <ClipboardCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Definição de Responsabilidade (LGPD)</h3>
                    <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Nossa plataforma atua estritamente como Operadora Técnica do tratamento dos dados. O Prestador de Serviço (você) figura como Controlador, responsável por garantir o respeito aos direitos de privacidade dos seus respectivos clientes finais.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox de consentimento com estilo Premium Apple */}
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-start gap-4">
                <input
                  id="lgpd"
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="mt-1 h-4.5 w-4.5 rounded-lg border-neutral-300 text-neutral-950 focus:ring-neutral-950 dark:border-neutral-800 dark:text-white dark:focus:ring-white cursor-pointer"
                />
                <div className="space-y-1.5">
                  <label htmlFor="lgpd" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                    Declaração de Consentimento
                  </label>
                  <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Estou ciente e concordo com as políticas de privacidade de dados, autorizando o tratamento técnico dos dados do meu WhatsApp comercial em conformidade com as diretrizes da LGPD (Lei Geral de Proteção de Dados).
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-neutral-100 dark:border-neutral-900">
                <Button
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="rounded-xl px-5 h-11 border-neutral-200 dark:border-neutral-800 gap-2 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={handleFinishOnboarding}
                  disabled={!lgpdAccepted || loading}
                  className="rounded-xl px-6 h-11 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-2 transition-all font-semibold text-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ativar Assistente Virtual
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Fino */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-[10px] text-neutral-400 text-center border-t border-neutral-100 dark:border-neutral-900">
        <span>Atendente Beta — Integração Integrada Controle Total. Proteção e criptografia ponta-a-ponta.</span>
      </footer>
    </div>
  );
}
