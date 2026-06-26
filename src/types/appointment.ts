export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type AppointmentTipo = "agendado" | "imediato";

export interface Appointment {
  id: string;
  user_id: string;
  cliente_id: string | null;
  cliente_nome: string;
  telefone: string | null;
  email: string | null;
  endereco: Record<string, unknown> | null;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string;
  valor: number;
  observacoes: string | null;
  status: AppointmentStatus;
  tipo: AppointmentTipo;
  atendimento_id: string | null;
  pacote_id: string | null;
  metodo_pagamento: string | null;
  status_publico: string | null;
  profissional_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFormData {
  cliente_nome: string;
  telefone: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string;
  valor: number;
  observacoes: string;
  status: AppointmentStatus;
  tipo: AppointmentTipo;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}
