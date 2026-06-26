import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, MapPin, ExternalLink } from "lucide-react";
import type { Appointment, AppointmentFormData, AppointmentStatus } from "@/types/appointment";
import { statusLabels } from "@/lib/statusHelpers";
import { formatPhoneBR } from "@/lib/utils";
import { db } from "@/integrations/db/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  onSave: (data: AppointmentFormData & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}

export default function AppointmentSheet({
  open, onOpenChange, appointment, defaultDate, defaultTime,
  onSave, onDelete, onStatusChange,
}: Props) {
  const isNew = !appointment?.id;
  const [saving, setSaving] = useState(false);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [loadingEndereco, setLoadingEndereco] = useState(false);
  const [buscaCep, setBuscaCep] = useState(false);
  const [form, setForm] = useState<AppointmentFormData>({
    cliente_nome: "",
    telefone: "",
    data: "",
    hora_inicio: "",
    hora_fim: "",
    servico: "",
    valor: 0,
    observacoes: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    status: "pending",
    tipo: "agendado",
  });

  async function buscarCEP(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setBuscaCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          rua: data.logradouro || f.rua,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          uf: data.uf || f.uf,
        }));
      }
    } finally {
      setBuscaCep(false);
    }
  }

  useEffect(() => {
    if (appointment) {
      setForm({
        cliente_nome: appointment.cliente_nome,
        telefone: formatPhoneBR(appointment.telefone ?? ""),
        data: appointment.data,
        hora_inicio: appointment.hora_inicio,
        hora_fim: appointment.hora_fim,
        servico: appointment.servico,
        valor: appointment.valor,
        observacoes: appointment.observacoes ?? "",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "",
        status: appointment.status,
        tipo: appointment.tipo,
      });
      loadClienteData();
    } else {
      setForm({
        cliente_nome: "",
        telefone: "",
        data: defaultDate ?? "",
        hora_inicio: defaultTime ?? "",
        hora_fim: "",
        servico: "",
        valor: 0,
        observacoes: "",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "",
        status: "pending",
        tipo: "agendado",
      });
      setEndereco(null);
    }
  }, [appointment, defaultDate, defaultTime, open]);

  async function loadClienteData() {
    if (!appointment?.cliente_id) {
      setEndereco(null);
      return;
    }
    setLoadingEndereco(true);
    setEndereco(null);
    const { data }: any = await db
      .from("clientes")
      .select("cep, endereco, rua, numero, bairro, cidade, uf")
      .eq("id", appointment.cliente_id)
      .maybeSingle();
    if (data) {
      const completo = [
        data.rua, data.numero, data.bairro, data.cidade, data.uf,
        data.cep ? `CEP ${data.cep}` : null,
      ].filter(Boolean).join(", ");
      setEndereco(completo || null);
      setForm((f) => ({
        ...f,
        cep: data.cep || "",
        rua: data.rua || "",
        numero: data.numero || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        uf: data.uf || "",
      }));
    }
    setLoadingEndereco(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_nome || !form.data || !form.hora_inicio) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        id: appointment?.id,
        cliente_id: appointment?.cliente_id,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    try {
      await onDelete(appointment.id);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir agendamento.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isNew ? "Novo Agendamento" : "Editar Agendamento"}</SheetTitle>
          <SheetDescription>
            {isNew ? "Preencha os dados para criar um novo agendamento" : "Altere os dados do agendamento"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente_nome">Cliente *</Label>
            <Input
              id="cliente_nome"
              value={form.cliente_nome}
              onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as "agendado" | "imediato" })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="agendado">Agendado</option>
                <option value="imediato">Imediato</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Início *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={form.hora_inicio}
                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fim">Fim</Label>
              <Input
                id="hora_fim"
                type="time"
                value={form.hora_fim}
                onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <Input
              id="servico"
              value={form.servico}
              onChange={(e) => setForm({ ...form, servico: e.target.value })}
              placeholder="Ex: Consulta, Corte, Massagem..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
            />
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground">Endereço do cliente</p>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="relative">
              <Input
                id="cep"
                value={form.cep}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                  const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
                  setForm({ ...form, cep: masked });
                  if (digits.length === 8) buscarCEP(digits);
                }}
                placeholder="00000-000"
                maxLength={9}
                className="w-36"
              />
              {buscaCep && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rua">Rua</Label>
              <Input
                id="rua"
                value={form.rua}
                onChange={(e) => setForm({ ...form, rua: e.target.value })}
                placeholder="Rua"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Nº"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value })}
                placeholder="UF"
                maxLength={2}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Observações sobre o agendamento..."
            />
          </div>

          {endereco && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/40">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Endereço do cliente
              </p>
              <p className="text-sm">{endereco}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "Waze", url: `https://waze.com/ul?q=${encodeURIComponent(endereco)}` },
                  { label: "Google Maps", url: `https://maps.google.com/?q=${encodeURIComponent(endereco)}` },
                  { label: "Apple Maps", url: `https://maps.apple.com/?q=${encodeURIComponent(endereco)}` },
                ].map((m) => (
                  <a
                    key={m.label}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {m.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!isNew && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(appointment.id, s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.status === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Button type="submit" size="sm" className="rounded-full" disabled={saving}>
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              {isNew ? "Criar Agendamento" : "Salvar Alterações"}
            </Button>
            {!isNew && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-destructive ml-auto"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
