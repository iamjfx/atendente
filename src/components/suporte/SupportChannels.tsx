import { Mail, MessageCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/data/suporte";

export default function SupportChannels() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Mail className="w-4 h-4" />
            </div>
            Suporte por E-mail
          </CardTitle>
          <CardDescription>Ideal para dúvidas complexas e solicitações</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full justify-between hover:bg-primary/5 group border-border/60">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center justify-between w-full">
              <span className="font-mono text-sm">{SUPPORT_EMAIL}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
              <MessageCircle className="w-4 h-4" />
            </div>
            WhatsApp Oficial
          </CardTitle>
          <CardDescription>
            {SUPPORT_WHATSAPP
              ? "Atendimento humanizado em horário comercial"
              : "Central de WhatsApp em implantação"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full justify-between border-border/60" disabled={!SUPPORT_WHATSAPP}>
            {SUPPORT_WHATSAPP ? (
              <a
                href={`https://api.whatsapp.com/send?phone=${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full"
              >
                <span>Falar com atendente</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">Disponível em breve</span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
