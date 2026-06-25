import { Lock, ShieldCheck, EyeOff, ClipboardCheck, ArrowLeft, Loader2, CheckCircle2, Smartphone, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  lgpdAccepted: boolean;
  setLgpdAccepted: (v: boolean) => void;
  loading: boolean;
  onFinish: () => void;
  onBack: () => void;
};

export default function StepSeguranca({ lgpdAccepted, setLgpdAccepted, loading, onFinish, onBack }: Props) {
  return (
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

      <div className="p-5 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/10">
        <p className="text-xs font-bold text-sky-700 dark:text-sky-300 mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Dica: use o Atendente como app no celular
        </p>
        <ul className="space-y-2 text-[11px] text-sky-600 dark:text-sky-400">
          <li className="flex items-start gap-2">
            <span className="font-bold shrink-0 mt-px">1.</span>
            <span><strong className="text-sky-700 dark:text-sky-300">Adicione à tela inicial:</strong> no iOS, clique em Compartilhar <span className="text-sky-500">→</span> Adicionar à Tela de Início. No Android, Menu <span className="text-sky-500">→</span> Adicionar à tela inicial. O Atendente vira um app de verdade.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold shrink-0 mt-px">2.</span>
            <span><strong className="text-sky-700 dark:text-sky-300">Comece o dia pela Agenda:</strong> sempre que um cliente agendar, a visita aparece automaticamente na <strong>Agenda</strong>. É lá que você acompanha sua rotina de visitas.</span>
          </li>
          <li className="flex items-start gap-2">
            <CalendarDays className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Não precisa ficar no WhatsApp o tempo todo — a IA atende, agenda e avisa você.</span>
          </li>
        </ul>
      </div>

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
          onClick={onFinish}
          disabled={!lgpdAccepted || loading}
          className="rounded-xl px-6 h-11 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-2 transition-all font-semibold text-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Ativar Assistente Virtual
          <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
