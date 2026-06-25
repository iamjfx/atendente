import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/integrations/db/client";
import { useAccount } from "@/contexts/AccountContext";
import { toast } from "sonner";

const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

export default function HorariosConfig() {
  const { profile } = useAccount();
  const [businessHours, setBusinessHours] = useState<{ dia_semana: number; abre: string; fecha: string; ativo: boolean }[]>(
    [1, 2, 3, 4, 5].map((d) => ({ dia_semana: d, abre: "08:00", fecha: "18:00", ativo: true }))
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    db.from("business_hours")
      .select("*")
      .eq("user_id", profile.id)
      .order("dia_semana", { ascending: true })
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setBusinessHours(
            data.map((bh: any) => ({
              dia_semana: bh.dia_semana,
              abre: bh.abre || "08:00",
              fecha: bh.fecha || "18:00",
              ativo: bh.ativo ?? true,
            }))
          );
        }
        setLoading(false);
      });
  }, [profile?.id]);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { data: existing } = await db.from("business_hours").select("user_id").eq("user_id", profile.id).maybeSingle();
      for (const bh of businessHours) {
        if (existing) {
          await db
            .from("business_hours")
            .update({ abre: bh.abre || null, fecha: bh.fecha || null, ativo: bh.ativo })
            .eq("user_id", profile.id)
            .eq("dia_semana", bh.dia_semana);
        } else {
          await db
            .from("business_hours")
            .insert({ user_id: profile.id, dia_semana: bh.dia_semana, abre: bh.abre || null, fecha: bh.fecha || null, ativo: bh.ativo });
        }
      }
      toast.success("Horários salvos com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Horários de Funcionamento
        </CardTitle>
        <CardDescription>
          Configure os dias e horários que sua empresa atende. A IA usará essas informações para sugerir agendamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando horários...
          </div>
        ) : (
          <div className="space-y-3">
            {businessHours.map((bh, i) => (
              <div key={bh.dia_semana} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <label className="flex items-center gap-2 min-w-[130px] text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bh.ativo}
                    onChange={() => {
                      const next = [...businessHours];
                      next[i] = { ...next[i], ativo: !next[i].ativo };
                      setBusinessHours(next);
                    }}
                    className="rounded"
                  />
                  {DIAS[bh.dia_semana]}
                </label>
                {bh.ativo && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={bh.abre}
                      onChange={(e) => {
                        const next = [...businessHours];
                        next[i] = { ...next[i], abre: e.target.value };
                        setBusinessHours(next);
                      }}
                      className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                    <span className="text-muted-foreground text-xs">às</span>
                    <input
                      type="time"
                      value={bh.fecha}
                      onChange={(e) => {
                        const next = [...businessHours];
                        next[i] = { ...next[i], fecha: e.target.value };
                        setBusinessHours(next);
                      }}
                      className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
            <Button className="w-full mt-2" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Horários
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
