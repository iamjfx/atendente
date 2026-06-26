import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto pb-16 md:pb-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center flex-wrap gap-2">
            {isNew ? "Novo Agendamento" : "Editar Agendamento"}
            {appointment && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                form.status === "confirmed" ? "bg-green-500/10 text-green-600" :
                form.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                form.status === "completed" ? "bg-blue-500/10 text-blue-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {statusLabels[form.status]}
              </span>
            )}
          </SheetTitle>
          {appointment && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Status:
              {(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(appointment.id, s)}
                  className={`ml-1.5 underline ${form.status === s ? "font-bold text-foreground" : "text-muted-foreground/60 hover:text-foreground"}`}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </p>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="cliente_nome" className="text-xs">Cliente *</Label>
              <Input
                id="cliente_nome"
                value={form.cliente_nome}
                onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                placeholder="Nome"
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="telefone" className="text-xs">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div className="space-y-0.5">
              <Label htmlFor="data" className="text-[10px]">Data *</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
                className="h-7 min-h-0 py-0 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="hora_inicio" className="text-[10px]">Início *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={form.hora_inicio}
                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                required
                className="h-7 min-h-0 py-0 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="hora_fim" className="text-[10px]">Fim</Label>
              <Input
                id="hora_fim"
                type="time"
                value={form.hora_fim}
                onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
                className="h-7 min-h-0 py-0 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="tipo" className="text-[10px]">Tipo</Label>
              <select
                id="tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as "agendado" | "imediato" })}
                className="h-7 text-xs w-full rounded-md border border-input bg-background px-1"
              >
                <option value="agendado">Agendado</option>
                <option value="imediato">Imediato</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="servico" className="text-xs">Serviço</Label>
              <Input
                id="servico"
                value={form.servico}
                onChange={(e) => setForm({ ...form, servico: e.target.value })}
                placeholder="Ex: Consulta"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valor" className="text-xs">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <Separator />
          <p className="text-[10px] font-semibold text-muted-foreground">Endereço do cliente</p>

          {/* Rua + Número */}
          <div className="flex gap-2">
            <div className="flex-[4] space-y-0.5">
              <Label htmlFor="rua" className="text-[10px]">Rua</Label>
              <Input
                id="rua"
                value={form.rua}
                onChange={(e) => setForm({ ...form, rua: e.target.value })}
                placeholder="Rua"
                className="h-7 text-xs"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <Label htmlFor="numero" className="text-[10px]">Nº</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Nº"
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* CEP + Bairro + Cidade */}
          <div className="flex gap-2 flex-wrap">
            <div className="space-y-0.5 w-[9ch]">
              <Label htmlFor="cep" className="text-[10px]">CEP</Label>
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
                  className="h-7 text-xs"
                />
                {buscaCep && (
                  <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex-1 space-y-0.5 min-w-[120px]">
              <Label htmlFor="bairro" className="text-[10px]">Bairro</Label>
              <Input
                id="bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Bairro"
                className="h-7 text-xs"
              />
            </div>
            <div className="flex-1 space-y-0.5 min-w-[120px]">
              <Label htmlFor="cidade" className="text-[10px]">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Cidade"
                className="h-7 text-xs"
              />
            </div>
            <div className="hidden md:block space-y-0.5 w-14">
              <Label htmlFor="uf" className="text-[10px]">UF</Label>
              <Input
                id="uf"
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value })}
                placeholder="UF"
                maxLength={2}
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="observacoes" className="text-xs">Observações</Label>
            <textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="flex min-h-[52px] w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Observações..."
            />
          </div>

          {endereco && (
            <div className="p-2 rounded-lg bg-muted/50 border border-border/40">
              <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" />
                Endereço do cliente
              </p>
              <p className="text-xs mb-2">{endereco}</p>
              <div className="flex flex-wrap gap-1.5">
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
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    {m.label}
                  </a>
                ))}
              </div>
            </div>
          )}


          <div className="flex items-center gap-2 pt-3 border-t border-border pb-4 md:pb-0">
            <Button type="submit" size="sm" className="rounded-full h-8 text-xs" disabled={saving}>
              {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {isNew ? "Criar" : "Salvar"}
            </Button>
            {!isNew && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-destructive ml-auto h-8 text-xs"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
