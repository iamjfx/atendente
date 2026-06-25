import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { db } from "@/integrations/db/client";
import { useAccount } from "@/contexts/AccountContext";
import { toast } from "sonner";

interface Servico {
  id?: string;
  nome: string;
  duracao_minutos: number | null;
  valor_padrao: number | null;
  ativo: boolean;
}

export default function CatalogoConfig() {
  const { profile } = useAccount();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editServico, setEditServico] = useState<Servico | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    db.from("servicos_catalogo")
      .select("id, nome, duracao_minutos, valor_padrao, ativo")
      .eq("user_id", profile.id)
      .order("nome", { ascending: true })
      .then(({ data }: any) => {
        if (data) setServicos(data);
        setLoading(false);
      });
  }, [profile?.id]);

  async function handleSave() {
    if (!profile?.id || !editServico?.nome.trim()) return;
    setSaving(true);
    try {
      const payload = {
        user_id: profile.id,
        nome: editServico.nome.trim(),
        duracao_minutos: editServico.duracao_minutos || null,
        valor_padrao: editServico.valor_padrao || null,
        ativo: editServico.ativo,
      };

      if (editServico.id) {
        await db.from("servicos_catalogo").update(payload).eq("id", editServico.id);
      } else {
        await db.from("servicos_catalogo").insert(payload);
      }

      setShowForm(false);
      setEditServico(null);
      const { data } = await db.from("servicos_catalogo").select("id, nome, duracao_minutos, valor_padrao, ativo").eq("user_id", profile.id).order("nome", { ascending: true });
      if (data) setServicos(data);
      toast.success(editServico.id ? "Serviço atualizado!" : "Serviço adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar serviço.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    try {
      await db.from("servicos_catalogo").delete().eq("id", id);
      setServicos((prev) => prev.filter((s) => s.id !== id));
      toast.success("Serviço excluído.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir serviço.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Serviços
        </CardTitle>
        <CardDescription>
          Cadastre os serviços que sua empresa oferece. A IA usará essa lista para sugerir agendamentos aos clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando serviços...
          </div>
        ) : (
          <div className="space-y-3">
            {servicos.length === 0 && !showForm && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum serviço cadastrado ainda.
              </p>
            )}

            {servicos.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.duracao_minutos ? `${s.duracao_minutos} min` : "Duração não definida"}
                    {s.valor_padrao != null && ` · R$ ${Number(s.valor_padrao).toFixed(2)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={s.ativo ?? true}
                    onCheckedChange={async (v) => {
                      await db.from("servicos_catalogo").update({ ativo: v }).eq("id", s.id);
                      setServicos((prev) => prev.map((x) => (x.id === s.id ? { ...x, ativo: v } : x)));
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditServico({ ...s });
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => s.id && handleDelete(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {showForm && (
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <div className="space-y-2">
                  <Label>Nome do Serviço</Label>
                  <Input
                    value={editServico?.nome || ""}
                    onChange={(e) => setEditServico((prev) => ({ ...prev!, nome: e.target.value, ativo: prev?.ativo ?? true }))}
                    placeholder="Ex: Instalação de fechadura smart"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duração (minutos)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={5}
                      value={editServico?.duracao_minutos ?? ""}
                      onChange={(e) => setEditServico((prev) => ({ ...prev!, duracao_minutos: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={editServico?.valor_padrao ?? ""}
                      onChange={(e) => setEditServico((prev) => ({ ...prev!, valor_padrao: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving || !editServico?.nome.trim()}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editServico?.id ? "Atualizar" : "Adicionar"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setEditServico(null); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {!showForm && (
              <Button className="w-full" variant="outline" onClick={() => {
                setEditServico({ nome: "", duracao_minutos: null, valor_padrao: null, ativo: true });
                setShowForm(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Serviço
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
