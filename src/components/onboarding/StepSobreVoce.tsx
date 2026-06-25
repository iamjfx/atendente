import { Sparkles, ArrowRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  nomeUsuario: string;
  setNomeUsuario: (v: string) => void;
  profile: any;
  hasProduct: (slug: string) => boolean;
  onNext: () => void;
};

export default function StepSobreVoce({ nomeUsuario, setNomeUsuario, profile, hasProduct, onNext }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {hasProduct("controletotal") && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
              Que bom te ver por aqui também, {profile?.nome_usuario || profile?.nome}! 🌟
            </h3>
            <p className="text-xs leading-relaxed text-amber-700/80 dark:text-amber-300/80">
              Já trouxemos seus dados cadastrais preenchidos do <strong>Controle Total</strong> para facilitar seu onboarding. Por favor, confira se as informações estão corretas.
            </p>
          </div>
        </div>
      )}

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
          onClick={onNext}
          disabled={!nomeUsuario.trim()}
          className="rounded-xl px-6 h-12 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-2 transition-all font-semibold text-sm"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
