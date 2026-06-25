import { Search, Check, ArrowRight, ArrowLeft, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RAMOS } from "@/lib/ramos";
import { formatPhoneBR } from "@/lib/onboarding";
import { CATEGORIA_ICONE } from "@/data/onboarding";

type Props = {
  nomeFantasia: string;
  setNomeFantasia: (v: string) => void;
  telefone: string;
  setTelefone: (v: string) => void;
  cnpjCpf: string;
  setCnpjCpf: (v: string) => void;
  cidade: string;
  setCidade: (v: string) => void;
  uf: string;
  setUf: (v: string) => void;
  buscaRamo: string;
  setBuscaRamo: (v: string) => void;
  ramoId: string | null;
  setRamoId: (v: string | null) => void;
  ramoOutro: string;
  setRamoOutro: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function StepNegocio({
  nomeFantasia, setNomeFantasia,
  telefone, setTelefone,
  cnpjCpf, setCnpjCpf,
  cidade, setCidade,
  uf, setUf,
  buscaRamo, setBuscaRamo,
  ramoId, setRamoId,
  ramoOutro, setRamoOutro,
  onNext, onBack,
}: Props) {
  const filterRamos = RAMOS.filter((r) =>
    r.label.toLowerCase().includes(buscaRamo.toLowerCase()) ||
    r.categoria.toLowerCase().includes(buscaRamo.toLowerCase())
  );

  return (
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
          onClick={onBack}
          className="rounded-xl px-4 h-10 border-neutral-200 dark:border-neutral-800 gap-1.5 font-medium text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!ramoId || !nomeFantasia.trim() || !telefone.trim() || !cidade.trim() || !uf.trim() || (ramoId === "outro" && !ramoOutro.trim())}
          className="rounded-xl px-5 h-10 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-1.5 transition-all font-semibold text-xs"
        >
          Continuar
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
