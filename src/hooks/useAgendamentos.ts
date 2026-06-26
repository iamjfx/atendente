import { useState, useEffect, useCallback } from "react";
import { db } from "@/integrations/db/client";
import { toast } from "sonner";
import type { Appointment } from "@/types/appointment";

const ROW_MAPPING = {
  cliente_nome: "cliente_nome",
  telefone: "telefone",
  email: "email",
  endereco: "endereco",
  data: "data",
  hora_inicio: "hora_inicio",
  hora_fim: "hora_fim",
  servico: "servico",
  valor: "valor",
  observacoes: "observacoes",
  status: "status",
  tipo: "tipo",
} as const;

function rowToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    cliente_id: row.cliente_id as string | null,
    cliente_nome: row.cliente_nome as string,
    telefone: row.telefone as string | null,
    email: row.email as string | null,
    endereco: row.endereco as Record<string, unknown> | null,
    data: (row.data as string).split("T")[0],
    hora_inicio: row.hora_inicio as string,
    hora_fim: row.hora_fim as string,
    servico: row.servico as string,
    valor: Number(row.valor),
    observacoes: row.observacoes as string | null,
    status: row.status as Appointment["status"],
    tipo: row.tipo as Appointment["tipo"],
    atendimento_id: row.atendimento_id as string | null,
    pacote_id: row.pacote_id as string | null,
    metodo_pagamento: row.metodo_pagamento as string | null,
    status_publico: row.status_publico as string | null,
    profissional_id: row.profissional_id as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function useAgendamentos() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data, error } = await db
      .from("agendamentos")
      .select("*")
      .order("data", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } else {
      setAppointments((data ?? []).map(rowToAppointment));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function salvarEnderecoCliente(
    apt: any,
    userId: string,
    _agendamentoId?: string
  ) {
    if (!apt.cep && !apt.rua && !apt.bairro && !apt.cidade) return;

    let clienteId = apt.cliente_id;

    // Se não tem cliente_id, busca por telefone
    if (!clienteId) {
      const telefone = (apt.telefone || "").replace(/\D/g, "").replace(/^55/, "");
      if (!telefone) return;

      const { data: existente } = await db
        .from("clientes")
        .select("id")
        .eq("user_id", userId)
        .eq("telefone", telefone)
        .maybeSingle();
      if (existente) clienteId = existente.id;
    }

    const payload: Record<string, any> = {
      cep: apt.cep || null,
      rua: apt.rua || null,
      numero: apt.numero || null,
      bairro: apt.bairro || null,
      cidade: apt.cidade || null,
      uf: apt.uf || null,
    };

    try {
      if (clienteId) {
        await db.from("clientes").update(payload).eq("id", clienteId);
      } else {
        const telefone = (apt.telefone || "").replace(/\D/g, "").replace(/^55/, "");
        await db.from("clientes").insert({
          ...payload,
          user_id: userId,
          nome: apt.cliente_nome || "Cliente",
          telefone: telefone || null,
        });
      }
    } catch (err: any) {
      console.error("Erro ao salvar endereço do cliente:", err);
    }
  }

  const save = async (apt: Partial<Appointment> & Pick<Appointment, "cliente_nome" | "data" | "hora_inicio" | "hora_fim" | "servico">) => {
    const isNew = !apt.id;

    if (isNew) {
      const { data: user } = await db.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const payload = {
        user_id: apt.user_id || user.user.id,
        cliente_nome: apt.cliente_nome,
        telefone: apt.telefone || null,
        email: apt.email || null,
        endereco: apt.endereco || null,
        data: apt.data,
        hora_inicio: apt.hora_inicio,
        hora_fim: apt.hora_fim,
        servico: apt.servico,
        valor: apt.valor ?? 0,
        observacoes: apt.observacoes || null,
        status: apt.status || "pending",
        tipo: apt.tipo || "agendado",
      };

      const { data, error } = await db
        .from("agendamentos")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setAppointments((prev) => [...prev, rowToAppointment(data)].sort(sortAppointments));
      }
      // Salva endereço no cliente após criar agendamento
      await salvarEnderecoCliente(apt, user.user.id, data?.id);
      toast.success("Agendamento criado!");
    } else {
      const { data, error } = await db
        .from("agendamentos")
        .update({
          cliente_nome: apt.cliente_nome,
          telefone: apt.telefone || null,
          email: apt.email || null,
          endereco: apt.endereco || null,
          data: apt.data,
          hora_inicio: apt.hora_inicio,
          hora_fim: apt.hora_fim,
          servico: apt.servico,
          valor: apt.valor ?? 0,
          observacoes: apt.observacoes || null,
          status: apt.status,
          tipo: apt.tipo,
        })
        .eq("id", apt.id!)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? rowToAppointment(data) : a))
        );
      }
      // Salva endereço no cliente após atualizar agendamento
      const userId = data?.user_id || (apt as any).user_id;
      if (userId) {
        await salvarEnderecoCliente(apt, userId, data?.id);
      }
      toast.success("Agendamento atualizado!");
    }
  };

  const remove = async (id: string) => {
    const { error } = await db.from("agendamentos").delete().eq("id", id);
    if (error) throw error;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const setStatus = async (id: string, status: Appointment["status"]) => {
    const { error } = await db
      .from("agendamentos")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  return { appointments, loading, save, remove, setStatus, reload: load };
}

function sortAppointments(a: Appointment, b: Appointment) {
  const dateCmp = a.data.localeCompare(b.data);
  if (dateCmp !== 0) return dateCmp;
  return a.hora_inicio.localeCompare(b.hora_inicio);
}
