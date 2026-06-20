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
import { Loader2, Trash2 } from "lucide-react";
import type { Appointment, AppointmentFormData, AppointmentStatus } from "@/types/appointment";
import { statusLabels } from "@/lib/statusHelpers";

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
  const [form, setForm] = useState<AppointmentFormData>({
    cliente_nome: "",
    telefone: "",
    data: "",
    hora_inicio: "",
    hora_fim: "",
    servico: "",
    valor: 0,
    observacoes: "",
    status: "pending",
    tipo: "agendado",
  });

  useEffect(() => {
    if (appointment) {
      setForm({
        cliente_nome: appointment.cliente_nome,
        telefone: appointment.telefone ?? "",
        data: appointment.data,
        hora_inicio: appointment.hora_inicio,
        hora_fim: appointment.hora_fim,
        servico: appointment.servico,
        valor: appointment.valor,
        observacoes: appointment.observacoes ?? "",
        status: appointment.status,
        tipo: appointment.tipo,
      });
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
        status: "pending",
        tipo: "agendado",
      });
    }
  }, [appointment, defaultDate, defaultTime, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_nome || !form.data || !form.hora_inicio) return;
    setSaving(true);
    try {
      await onSave({ ...form, id: appointment?.id });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    await onDelete(appointment.id);
    onOpenChange(false);
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
