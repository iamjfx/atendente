import { Smartphone, ArrowLeft, ArrowRight, Loader2, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  nomeIa: string;
  fetchingQr: boolean;
  qrCode: string | null;
  instance: any;
  onStartConnection: () => void;
  onRefreshQrCode: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export default function StepConexao({
  nomeIa, fetchingQr, qrCode, instance,
  onStartConnection, onRefreshQrCode, onBack, onSkip,
}: Props) {
  return (
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
                onClick={onRefreshQrCode}
                disabled={fetchingQr}
                className="rounded-xl h-11 px-5 text-sm"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", fetchingQr && "animate-spin")} />
                Gerar novo QR Code
              </Button>
              <Button
                variant="ghost"
                size="default"
                onClick={onSkip}
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
              onClick={onStartConnection}
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
          onClick={onBack}
          className="rounded-xl px-5 h-11 border-neutral-200 dark:border-neutral-800 gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          className="rounded-xl gap-2 font-medium text-neutral-500 hover:text-neutral-900"
        >
          Pular etapa por enquanto
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
