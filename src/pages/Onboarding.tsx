import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { cn } from "@/lib/utils";
import { stepsLabel } from "@/data/onboarding";
import { getRamoById } from "@/lib/ramos";
import { toast } from "sonner";
import StepSobreVoce from "@/components/onboarding/StepSobreVoce";
import StepNegocio from "@/components/onboarding/StepNegocio";
import StepAssistente from "@/components/onboarding/StepAssistente";
import StepConexao from "@/components/onboarding/StepConexao";
import StepSeguranca from "@/components/onboarding/StepSeguranca";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";

export default function Onboarding() {
  const { signOut } = useAuth();
  const { profile, refetch, hasProduct } = useAccount();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [nomeIa, setNomeIa] = useState("");
  const [buscaRamo, setBuscaRamo] = useState("");
  const [ramoId, setRamoId] = useState<string | null>(null);
  const [ramoOutro, setRamoOutro] = useState("");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  const {
    instance, fetchingQr, qrCode,
    startConnection, refreshQrCode,
  } = useWhatsAppConnection(profile?.id);

  useEffect(() => {
    if (!profile) return;
    setNomeUsuario(profile.nome_usuario || profile.nome || "");
    setNomeFantasia(profile.nome_fantasia || "");
    setNomeIa(profile.nome_ia || "");
    setTelefone(profile.telefone || "");
    setCnpjCpf(profile.cnpj_cpf || "");
    setCidade(profile.cidade || "");
    setUf(profile.uf || "");
    if (profile.ramo_atividade) setRamoId(profile.ramo_atividade);
    if (profile.ramo_outro) setRamoOutro(profile.ramo_outro);
  }, [profile]);

  useEffect(() => {
    if (profile?.onboarding_completo) {
      navigate("/admin", { replace: true });
    }
  }, [profile?.onboarding_completo, navigate]);

  useEffect(() => {
    if (instance?.connection_status === "connected") {
      setStep(5);
    }
  }, [instance?.connection_status]);

  async function handleSaveProfiles() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const ramo = getRamoById(ramoId);
      const update = {
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
      };
      const { error } = await db.from("profiles").update(update).eq("id", profile.id);
      if (error) throw error;
      toast.success("Informações de perfil gravadas!");
      setStep(4);
      await startConnection();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishOnboarding() {
    if (!profile?.id || !lgpdAccepted) return;
    setLoading(true);
    try {
      const { error } = await db
        .from("profiles")
        .update({
          onboarding_completo: true,
          lgpd_aceito_em: new Date().toISOString(),
          lgpd_versao_privacidade: "1.0",
          lgpd_versao_termos: "1.0",
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

  return (
    <div className="h-screen bg-[#fafafa] dark:bg-[#09090b] flex flex-col justify-between font-sans antialiased text-neutral-800 dark:text-neutral-200 overflow-hidden">
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
          onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
          className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Sair da conta
        </button>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-4 flex flex-col justify-center min-h-0">
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

        <div className="bg-white dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-0 flex flex-col justify-between overflow-y-auto max-h-[72vh]">
          {step === 1 && (
            <StepSobreVoce
              nomeUsuario={nomeUsuario}
              setNomeUsuario={setNomeUsuario}
              profile={profile}
              hasProduct={hasProduct}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepNegocio
              nomeFantasia={nomeFantasia} setNomeFantasia={setNomeFantasia}
              telefone={telefone} setTelefone={setTelefone}
              cnpjCpf={cnpjCpf} setCnpjCpf={setCnpjCpf}
              cidade={cidade} setCidade={setCidade}
              uf={uf} setUf={setUf}
              buscaRamo={buscaRamo} setBuscaRamo={setBuscaRamo}
              ramoId={ramoId} setRamoId={setRamoId}
              ramoOutro={ramoOutro} setRamoOutro={setRamoOutro}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepAssistente
              nomeIa={nomeIa}
              setNomeIa={setNomeIa}
              loading={loading}
              onNext={handleSaveProfiles}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <StepConexao
              nomeIa={nomeIa}
              fetchingQr={fetchingQr}
              qrCode={qrCode}
              instance={instance}
              onStartConnection={startConnection}
              onRefreshQrCode={refreshQrCode}
              onBack={() => setStep(3)}
              onSkip={() => setStep(5)}
            />
          )}
          {step === 5 && (
            <StepSeguranca
              lgpdAccepted={lgpdAccepted}
              setLgpdAccepted={setLgpdAccepted}
              loading={loading}
              onFinish={handleFinishOnboarding}
              onBack={() => setStep(4)}
            />
          )}
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-[10px] text-neutral-400 text-center border-t border-neutral-100 dark:border-neutral-900">
        <span>Atendente Beta — Integração Integrada Controle Total. Proteção e criptografia ponta-a-ponta.</span>
      </footer>
    </div>
  );
}
