import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { db } from "@/integrations/db/client";
import { useAccount } from "@/contexts/AccountContext";
import { toast } from "sonner";

interface IaConfig {
  account_id?: string;
  autonomy_level: "full" | "screening" | "manual";
  collect_name: boolean;
  collect_phone: boolean;
  collect_service: boolean;
  collect_address: boolean;
  custom_instructions: string | null;
  greeting_message: string | null;
  closing_message: string | null;
  deslocamento_minutos: number;
}

export default function IaConfig() {
  const { profile } = useAccount();

  const [autonomyLevel, setAutonomyLevel] = useState<"full" | "screening" | "manual">("screening");
  const [collectName, setCollectName] = useState(true);
  const [collectPhone, setCollectPhone] = useState(false);
  const [collectService, setCollectService] = useState(true);
  const [collectAddress, setCollectAddress] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [deslocamentoMinutos, setDeslocamentoMinutos] = useState(30);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    db.from("ia_configs")
      .select("*")
      .eq("account_id", profile.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setAutonomyLevel(data.autonomy_level || "screening");
          setCollectName(data.collect_name ?? true);
          setCollectPhone(data.collect_phone ?? false);
          setCollectService(data.collect_service ?? true);
          setCollectAddress(data.collect_address ?? true);
          setCustomInstructions(data.custom_instructions || "");
          setGreetingMessage(data.greeting_message || "");
          setClosingMessage(data.closing_message || "");
          setDeslocamentoMinutos(data.deslocamento_minutos ?? 30);
        }
        setLoading(false);
      });
  }, [profile?.id]);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const config: IaConfig = {
        autonomy_level: autonomyLevel,
        collect_name: collectName,
        collect_phone: collectPhone,
        collect_service: collectService,
        collect_address: collectAddress,
        custom_instructions: customInstructions || null,
        greeting_message: greetingMessage || null,
        closing_message: closingMessage || null,
        deslocamento_minutos: deslocamentoMinutos,
      };

      const { data: existing } = await db
        .from("ia_configs")
        .select("account_id")
        .eq("account_id", profile.id)
        .maybeSingle();

      if (existing) {
        await db.from("ia_configs").update(config).eq("account_id", profile.id);
      } else {
        await db.from("ia_configs").insert({ ...config, account_id: profile.id });
      }

      toast.success("Configuração de IA salva com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Comportamento da IA
        </CardTitle>
        <CardDescription>
          Configure como a assistente IA deve interagir com seus clientes, quais informações coletar e qual o nível de autonomia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando configurações...
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Nível de Autonomia</Label>
              <div className="space-y-2">
                {[
                  { value: "full" as const, label: "Completa", desc: "IA faz tudo: triagem, orçamento e agendamento. Só chama você se não souber responder." },
                  { value: "screening" as const, label: "Triagem", desc: "IA coleta os dados do cliente e depois avisa que o responsável vai entrar em contato." },
                  { value: "manual" as const, label: "Manual", desc: "IA responde o básico e sempre transfere para você. Não faz perguntas aprofundadas." },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      autonomyLevel === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="autonomy"
                      value={opt.value}
                      checked={autonomyLevel === opt.value}
                      onChange={(e) => setAutonomyLevel(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {autonomyLevel !== "manual" && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Informações a Coletar</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  A IA deve perguntar ao cliente por:
                </p>
                <div className="space-y-2">
                  {[
                    { key: "collectName", label: "Nome do cliente", state: collectName, set: setCollectName },
                    { key: "collectPhone", label: "Telefone do cliente", state: collectPhone, set: setCollectPhone },
                    { key: "collectService", label: "Serviço / problema desejado", state: collectService, set: setCollectService },
                    { key: "collectAddress", label: "Endereço", state: collectAddress, set: setCollectAddress },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">
                        {item.label}
                      </Label>
                      <Switch
                        id={item.key}
                        checked={item.state}
                        onCheckedChange={(v) => item.set(v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <Label className="text-sm font-semibold">Personalização</Label>

              <div className="space-y-2">
                <Label htmlFor="greeting" className="text-xs">Mensagem de Saudação (opcional)</Label>
                <Input
                  id="greeting"
                  placeholder="Ex: Olá! Bem-vindo à Controle Total"
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing" className="text-xs">Mensagem ao Finalizar (opcional)</Label>
                <Input
                  id="closing"
                  placeholder='Ex: Obrigado! Nosso time entrará em contato em breve.'
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-xs">Instruções Extras para a IA (opcional)</Label>
                <textarea
                  id="instructions"
                  rows={4}
                  placeholder="Ex: Sempre pergunte se o cliente já foi atendido antes. Se sim, busque o histórico."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="deslocamento" className="text-sm font-semibold">Tempo de Deslocamento (minutos)</Label>
              <p className="text-xs text-muted-foreground">
                Tempo médio que o profissional leva para chegar até o cliente. Usado para calcular a disponibilidade na agenda.
              </p>
              <Input
                id="deslocamento"
                type="number"
                min={0}
                step={5}
                value={deslocamentoMinutos}
                onChange={(e) => setDeslocamentoMinutos(Number(e.target.value))}
                className="w-32"
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Configuração
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
