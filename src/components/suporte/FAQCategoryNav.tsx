import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { categorias, faqs, getCategoriaIcon } from "@/data/suporte";

type Props = {
  categoriaSelecionada: string;
  onSelectCategoria: (cat: string) => void;
};

export default function FAQCategoryNav({ categoriaSelecionada, onSelectCategoria }: Props) {
  return (
    <div className="lg:col-span-4 space-y-3">
      <div className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5" />
        Tópicos de Ajuda
      </div>

      <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 scrollbar-none">
        {categorias.map((cat) => {
          const IconComponent = getCategoriaIcon(cat);
          const isActive = categoriaSelecionada === cat;
          const count = faqs.filter((f) => f.categoria === cat).length;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategoria(cat)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 w-auto lg:w-full border focus:outline-none focus:ring-0 focus-visible:outline-none select-none ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-[1.01]"
                  : "bg-card hover:bg-accent/40 text-foreground/70 hover:text-foreground border-border/40"
              }`}
            >
              <IconComponent
                className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary/70"}`}
              />
              <span className="flex-1 truncate">{cat}</span>
              <Badge
                variant={isActive ? "outline" : "secondary"}
                className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                  isActive
                    ? "border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10"
                    : ""
                }`}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
