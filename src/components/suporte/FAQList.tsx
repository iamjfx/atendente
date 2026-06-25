import { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQContentRenderer } from "@/lib/suporte";
import { faqs } from "@/data/suporte";

type Props = {
  busca: string;
  categoriaSelecionada: string;
};

export default function FAQList({ busca, categoriaSelecionada }: Props) {
  const faqsFiltradas = useMemo(() => {
    return faqs.filter((f) => {
      const matchesSearch =
        busca.length < 2 ||
        f.q.toLowerCase().includes(busca.toLowerCase()) ||
        f.a.toLowerCase().includes(busca.toLowerCase()) ||
        f.categoria.toLowerCase().includes(busca.toLowerCase());

      if (busca.length >= 2) {
        return matchesSearch;
      }
      return matchesSearch && f.categoria === categoriaSelecionada;
    });
  }, [busca, categoriaSelecionada]);

  return (
    <div className="lg:col-span-8 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {busca.length >= 2 ? (
            <>
              <span>Resultados para "{busca}"</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                {faqsFiltradas.length}
              </Badge>
            </>
          ) : (
            <span>{categoriaSelecionada}</span>
          )}
        </h2>
      </div>

      {faqsFiltradas.length === 0 ? (
        <Card className="border border-dashed border-border/80 p-8 text-center bg-card/20 rounded-2xl">
          <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Nenhuma pergunta encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tente pesquisar termos diferentes ou navegue pelos tópicos ao lado.
          </p>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqsFiltradas.map((f, i) => (
            <AccordionItem
              key={`${f.q}-${i}`}
              value={`faq-${i}`}
              className="border border-border/40 rounded-xl overflow-hidden bg-card/30 hover:bg-card/70 hover:border-primary/20 transition-all duration-300 shadow-sm"
            >
              <AccordionTrigger className="text-left text-base font-semibold py-4.5 px-5 hover:no-underline hover:text-primary transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none [&[data-state=open]]:bg-primary/[0.02] [&[data-state=open]]:text-primary select-none border-none">
                <span className="flex items-center gap-3 pr-4">
                  <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                  {f.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-[15px] text-foreground/85 whitespace-pre-wrap leading-relaxed pb-6 pt-3 px-6 border-t border-border/30 bg-card/10">
                <FAQContentRenderer text={f.a} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
