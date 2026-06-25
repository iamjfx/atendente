import { Sparkles, ArrowRight, ArrowLeft, Loader2, MessageSquareQuote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  nomeIa: string;
  setNomeIa: (v: string) => void;
  loading: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function StepAssistente({ nomeIa, setNomeIa, loading, onNext, onBack }: Props) {
  return (
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
          onClick={onBack}
          className="rounded-xl px-4 h-10 border-neutral-200 dark:border-neutral-800 gap-1.5 font-medium text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!nomeIa.trim() || loading}
          className="rounded-xl px-5 h-10 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-1.5 transition-all font-semibold text-xs"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Confirmar e Configurar WhatsApp
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
