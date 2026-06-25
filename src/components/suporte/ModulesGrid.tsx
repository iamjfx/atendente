import { ExternalLink, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modulo } from "@/data/suporte";

type Props = {
  modulos: Modulo[];
};

export default function ModulesGrid({ modulos }: Props) {
  return (
    <Card className="border border-border/40 shadow-sm bg-card/30 rounded-2xl overflow-hidden mt-10">
      <CardHeader className="border-b border-border/20 bg-card/20 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <BookOpen className="w-5 h-5 text-primary" />
          Recursos da Plataforma
        </CardTitle>
        <CardDescription>Como funcionam as principais seções do Atendente</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulos.map((m) => (
            <div
              key={m.title}
              className="p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-accent/20 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <m.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-foreground mb-1">{m.title}</h3>
                <p className="text-xs text-foreground/75 leading-relaxed mb-4">{m.desc}</p>
                <ul className="space-y-2 mb-4">
                  {m.bullets.map((b, i) => (
                    <li key={i} className="text-[11px] text-foreground/75 flex gap-2 items-start leading-snug">
                      <span className="text-primary font-bold text-xs shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold justify-between mt-auto hover:bg-primary/5 text-primary">
                <Link to={m.href} className="flex items-center justify-between w-full">
                  <span>Acessar {m.title}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
