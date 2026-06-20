import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft } from "lucide-react";

export default function Upgrade() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-success/10 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Atendente não faz parte do seu plano
        </h1>
        <p className="text-muted-foreground mb-8">
          O Atendente — Recepcionista IA para WhatsApp — é um produto separado.
          Fale com a gente para contratar e começar a usar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:contato@atendente.app?subject=Quero contratar o Atendente"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 h-11 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Quero contratar
          </a>
          <Link to="/">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
