import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { modulos } from "@/data/suporte";
import SupportChannels from "@/components/suporte/SupportChannels";
import FAQCategoryNav from "@/components/suporte/FAQCategoryNav";
import FAQList from "@/components/suporte/FAQList";
import ModulesGrid from "@/components/suporte/ModulesGrid";

const categorias = [
  "WhatsApp e Conexão",
  "Recepcionista IA",
  "Agendamentos",
  "Clientes e Conversas",
  "Configurações e Conta",
];

export default function Suporte() {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(categorias[0]);

  const modulosFiltrados = useMemo(
    () =>
      modulos.filter(
        (m) =>
          busca.length < 2 ||
          m.title.toLowerCase().includes(busca.toLowerCase()) ||
          m.desc.toLowerCase().includes(busca.toLowerCase()) ||
          m.bullets.some((b) => b.toLowerCase().includes(busca.toLowerCase()))
      ),
    [busca]
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Central de Ajuda</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Encontre guias e respostas sobre a IA do Atendente
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
              Beta
            </span>
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
          <Input
            placeholder="Pesquisar ajuda..."
            className="pl-10 pr-4 py-5 bg-card border-border/60 shadow-sm focus-visible:ring-primary rounded-xl"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <SupportChannels />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <FAQCategoryNav
          categoriaSelecionada={categoriaSelecionada}
          onSelectCategoria={(cat) => {
            setCategoriaSelecionada(cat);
            setBusca("");
          }}
        />
        <FAQList busca={busca} categoriaSelecionada={categoriaSelecionada} />
      </div>

      <ModulesGrid modulos={modulosFiltrados} />
    </div>
  );
}
