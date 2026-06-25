import { db } from "../../lib/db.js";
import { sendMessage } from "../../lib/evolution.js";

export const AGENDAR_REGEX = /📅\s*AGENDAR\|\s*([^|]+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{2}:\d{2})(?:\|\s*(\d+))?/;
export const CANCELAR_REGEX = /📅\s*CANCELAR\|\s*(.+)/;
export const REAGENDAR_REGEX = /📅\s*REAGENDAR\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{2}:\d{2})/;
export const ORIGEM_REGEX = /📍\s*ORIGEM\s*\|\s*(.+)/;
export const ALL_MARKERS = /📅\s*(?:AGENDAR|CANCELAR|REAGENDAR)\|.*|📍\s*ORIGEM\s*\|.*/g;

export async function tryCriarAgendamento(
  aiResponse: string,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  _conversationId: string,
  remoteJid: string,
  pushName?: string
) {
  const match = aiResponse.match(AGENDAR_REGEX);
  if (match) {
    return criarAgendamentoComMatch(match, instanceRecord, remoteJid, pushName);
  }

  // Fallback NLP: tenta extrair data/horário do texto natural
  const nlp = extractAgendamentoNLP(aiResponse);
  if (nlp) {
    console.log(`⚠️ Agendamento via NLP: ${nlp.tipo} "${nlp.servico}" em ${nlp.data} às ${nlp.horario}`);

    if (nlp.tipo === "reagendar") {
      return tryReagendarAgendamentoNLP(nlp, instanceRecord, remoteJid, pushName);
    }

    // Verifica duplicidade antes de criar
    if (await existeAgendamentoNoHorario(instanceRecord.account_id, remoteJid, nlp.data, nlp.horario)) {
      console.log(`⚠️ Agendamento duplicado ignorado (NLP): ${nlp.servico} em ${nlp.data} às ${nlp.horario}`);
      return null;
    }

    const fakeMatch = ["", nlp.servico, nlp.data, nlp.horario] as unknown as RegExpMatchArray;
    return criarAgendamentoComMatch(fakeMatch, instanceRecord, remoteJid, pushName);
  }

  return null;
}

function fmtData(data: Date | string, hora: string): string {
  const d = typeof data === "string" ? new Date(data + "T12:00:00") : data;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes} às ${hora}hs`;
}

const DIAS_MAP: Record<string, number> = {
  domingo: 0, segunda: 1, "segunda-feira": 1, terça: 2, "terça-feira": 2,
  quarta: 3, "quarta-feira": 3, quinta: 4, "quinta-feira": 4,
  sexta: 5, "sexta-feira": 5, sábado: 6, sabado: 6,
};

function parseDataRelativa(texto: string): { data: string; horario: string } | null {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const lower = texto.toLowerCase();
  let offset = 0;

  if (lower.includes("depois de amanhã") || lower.includes("depois de amanha")) {
    offset = 2;
  } else if (lower.includes("amanhã") || lower.includes("amanha")) {
    offset = 1;
  } else if (lower.includes("hoje")) {
    offset = 0;
  } else {
    for (const [nome, idx] of Object.entries(DIAS_MAP)) {
      if (lower.includes(nome)) {
        offset = (idx - hoje.getDay() + 7) % 7;
        if (offset === 0) offset = 7;
        break;
      }
    }
  }

  const dataObj = new Date(hoje);
  dataObj.setDate(hoje.getDate() + offset);
  const data = dataObj.toISOString().split("T")[0];

  const horaMatch = lower.match(/(?:às|as)\s*(\d{1,2})[h:](\d{2})/i)
    || lower.match(/[-–]\s*(\d{1,2})[h:](\d{2})/)
    || lower.match(/(\d{1,2})[h:](\d{2})/);
  if (!horaMatch) return null;

  const horario = `${String(Number(horaMatch[1])).padStart(2, "0")}:${horaMatch[2]}`;
  return { data, horario };
}

function extractAgendamentoNLP(aiResponse: string): { tipo: "criar" | "reagendar"; servico: string; data: string; horario: string } | null {
  const lower = aiResponse.toLowerCase();

  // Reagendamento tem prioridade
  if (lower.includes("reagendad") || lower.includes("remarcad") || lower.includes("alterad")) {
    const parsed = parseDataRelativa(aiResponse);
    if (!parsed) return null;
    const servicoMatch = aiResponse.match(/para\s+(.+?)(?:\s*[,.]|\s+em|\s+no|\s+na|$)/i);
    const servico = servicoMatch ? servicoMatch[1].trim() : "consulta";
    console.log(`🔍 NLP (reagendar): texto="${aiResponse.slice(0, 60)}..." data=${parsed.data} horario=${parsed.horario}`);
    return { tipo: "reagendar", servico, data: parsed.data, horario: parsed.horario };
  }

  if (!lower.includes("agendad") && !lower.includes("confirmad") && !lower.includes("marcad")) return null;

  const parsed = parseDataRelativa(aiResponse);
  if (!parsed) return null;

  const servicoMatch = aiResponse.match(/para\s+(.+?)(?:\s*[,.]|\s+em|\s+no|\s+na|$)/i)
    || aiResponse.match(/agendad[ao]\s+(.+?)(?:\s*[,.]|\s+para|\s+em|\s+no|\s+na|$)/i);
  const servico = servicoMatch ? servicoMatch[1].trim() : "consulta";

  console.log(`🔍 NLP (criar): texto="${aiResponse.slice(0, 60)}..." servico="${servico}" data=${parsed.data} horario=${parsed.horario}`);
  return { tipo: "criar", servico, data: parsed.data, horario: parsed.horario };
}

async function existeAgendamentoNoHorario(accountId: string, remoteJid: string, data: string, horario: string): Promise<boolean> {
  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);
  const { data: existente } = await db
    .from("agendamentos")
    .select("id")
    .eq("user_id", accountId)
    .eq("telefone", phoneStr)
    .eq("data", data)
    .eq("hora_inicio", horario)
    .not("status", "eq", "cancelled")
    .maybeSingle();
  return !!existente;
}

async function tryReagendarAgendamentoNLP(
  nlp: { servico: string; data: string; horario: string },
  instanceRecord: { id: string; account_id: string; instance_name: string },
  remoteJid: string,
  pushName?: string
) {
  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

  // Busca agendamento existente do cliente (mais recente primeiro)
  const { data: agenda } = await db
    .from("agendamentos")
    .select("id, servico, data, hora_inicio")
    .eq("user_id", instanceRecord.account_id)
    .eq("telefone", phoneStr)
    .in("status", ["confirmed", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!agenda) return null;

  // Atualiza com nova data/hora
  const [h, m] = nlp.horario.split(":").map(Number);
  const novaHoraFim = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const { error } = await db
    .from("agendamentos")
    .update({ data: nlp.data, hora_inicio: nlp.horario, hora_fim: novaHoraFim, status: "confirmed" })
    .eq("id", agenda.id);

  if (error) {
    console.error(`Erro ao reagendar via NLP:`, error.message);
    return null;
  }

  console.log(`🔄 Agendamento reagendado via NLP: ${agenda.servico} → ${nlp.data} ${nlp.horario}`);
  return { ...agenda, nova_data: nlp.data, novo_horario: nlp.horario, deslocamento_minutos: 30 };
}

async function criarAgendamentoComMatch(
  match: RegExpMatchArray,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  remoteJid: string,
  pushName?: string
) {

  const servico = match[1].trim();
  const data = match[2];
  const horaInicio = match[3];
  const deslocamentoMin = match[4] ? parseInt(match[4]) : null;

  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

  // Verifica duplicidade
  if (await existeAgendamentoNoHorario(instanceRecord.account_id, remoteJid, data, horaInicio)) {
    console.log(`⚠️ Agendamento duplicado ignorado: ${servico} em ${data} às ${horaInicio}`);
    return null;
  }

  let deslocamento = deslocamentoMin ?? 30;
  if (!deslocamentoMin) {
    const { data: cfg } = await db
      .from("ia_configs")
      .select("deslocamento_minutos")
      .eq("account_id", instanceRecord.account_id)
      .maybeSingle();
    deslocamento = cfg?.deslocamento_minutos ?? 30;
  }

  const { data: servicoInfo } = await db
    .from("servicos_catalogo")
    .select("duracao_minutos")
    .eq("user_id", instanceRecord.account_id)
    .eq("nome", servico)
    .maybeSingle();

  const duracaoMin = servicoInfo?.duracao_minutos || 60;

  const [h, m] = horaInicio.split(":").map(Number);
  const totalMin = h * 60 + m + duracaoMin;
  const horaFim = `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

  const { data: existingClient } = await db
    .from("clientes")
    .select("id")
    .eq("user_id", instanceRecord.account_id)
    .eq("telefone", phoneStr)
    .maybeSingle();

  let clienteId: string | null = existingClient?.id || null;
  if (!clienteId) {
    const { data: newClient } = await db
      .from("clientes")
      .insert({
        user_id: instanceRecord.account_id,
        nome: pushName || "Cliente",
        telefone: phoneStr,
      })
      .select("id")
      .single();
    clienteId = newClient?.id || null;
  }

  const { data: novo, error } = await db
    .from("agendamentos")
    .insert({
      user_id: instanceRecord.account_id,
      cliente_id: clienteId,
      cliente_nome: pushName || "Cliente",
      telefone: phoneStr,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      servico,
      status: "confirmed",
      observacoes: deslocamento ? `Deslocamento: ${deslocamento} min` : null,
    })
    .select()
    .single();

  if (error) {
    console.error(`Erro ao criar agendamento automático:`, error.message);
    return null;
  }

  console.log(`✅ Agendamento automático criado para ${pushName || phoneStr}: ${servico} em ${data} às ${horaInicio} (deslocamento: ${deslocamento}min, duração: ${duracaoMin}min)`);
  return { ...novo, deslocamento_minutos: deslocamento };
}

export async function tryCancelarAgendamento(
  aiResponse: string,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  _conversationId: string,
  remoteJid: string,
  _pushName?: string
) {
  const match = aiResponse.match(CANCELAR_REGEX);
  if (!match) return null;

  const motivo = match[1].trim();
  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

  const { data: agenda } = await db
    .from("agendamentos")
    .select("id, servico, data, hora_inicio")
    .eq("user_id", instanceRecord.account_id)
    .eq("telefone", phoneStr)
    .in("status", ["confirmed", "pending"])
    .gte("data", new Date().toISOString().split("T")[0])
    .order("data", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!agenda) return null;

  const { error } = await db.from("agendamentos").update({ status: "cancelled" }).eq("id", agenda.id);

  if (error) {
    console.error(`Erro ao cancelar agendamento:`, error.message);
    return null;
  }

  console.log(`❌ Agendamento cancelado (${motivo}): ${agenda.servico} em ${agenda.data} às ${agenda.hora_inicio}`);
  return agenda;
}

export async function tryReagendarAgendamento(
  aiResponse: string,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  _conversationId: string,
  remoteJid: string,
  _pushName?: string
) {
  const match = aiResponse.match(REAGENDAR_REGEX);
  if (!match) return null;

  const novaData = match[1];
  const novoHorario = match[2];
  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

  const { data: agenda } = await db
    .from("agendamentos")
    .select("id, servico, data, hora_inicio")
    .eq("user_id", instanceRecord.account_id)
    .eq("telefone", phoneStr)
    .in("status", ["confirmed", "pending"])
    .gte("data", new Date().toISOString().split("T")[0])
    .order("data", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!agenda) return null;

  const [h, m] = novoHorario.split(":").map(Number);
  const novaHoraFim = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const { error } = await db
    .from("agendamentos")
    .update({ data: novaData, hora_inicio: novoHorario, hora_fim: novaHoraFim, status: "confirmed" })
    .eq("id", agenda.id);

  if (error) {
    console.error(`Erro ao reagendar:`, error.message);
    return null;
  }

  console.log(`🔄 Agendamento reagendado: ${agenda.servico} de ${agenda.data} ${agenda.hora_inicio} → ${novaData} ${novoHorario}`);
  return { ...agenda, nova_data: novaData, novo_horario: novoHorario };
}

export function extractOrigem(aiResponse: string): string | null {
  const match = aiResponse.match(ORIGEM_REGEX);
  if (!match) return null;
  return match[1].trim();
}

export async function salvarOrigem(
  remoteJid: string,
  accountId: string,
  origem: string
) {
  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);
  await db
    .from("clientes")
    .update({ origem })
    .eq("user_id", accountId)
    .eq("telefone", phoneStr);
  console.log(`📍 Origem salva para ${phoneStr}: "${origem}"`);
}

export async function sendPerguntaOrigem(
  instanceRecord: { id: string; account_id: string; instance_name: string; businessName?: string },
  remoteJid: string,
  pushName?: string
) {
  const empresa = instanceRecord.businessName || "a empresa";
  const nome = pushName || "";
  const msg = nome
    ? `${nome}, mais uma coisa: como você conheceu ${empresa}? 😊`
    : `Mais uma coisa: como você conheceu ${empresa}? 😊`;

  setTimeout(async () => {
    try {
      await sendMessage(instanceRecord.instance_name, remoteJid, msg);
      console.log(`📍 Pergunta de origem enviada para ${remoteJid}`);
    } catch (err) {
      console.error(`Erro ao enviar pergunta de origem:`, err);
    }
  }, 5 * 60 * 1000);
}

export async function notificarDono(
  instanceRecord: { id: string; account_id: string; instance_name: string },
  agendamento: { servico: string; data: string; hora_inicio: string; deslocamento_minutos?: number },
  remoteJid: string,
  pushName?: string
) {
  try {
    const { data: profile } = await db
      .from("profiles")
      .select("telefone, nome_fantasia")
      .eq("id", instanceRecord.account_id)
      .maybeSingle();

    const donoTelefone = profile?.telefone;
    if (!donoTelefone) return;

    const clienteNome = pushName || remoteJid.replace(/[^0-9]/g, "").slice(0, 11);
    const empresa = profile?.nome_fantasia || "Controle Total";

    const desloc = agendamento.deslocamento_minutos || 30;
    const [h, m] = agendamento.hora_inicio.split(":").map(Number);
    const saidaMin = h * 60 + m - desloc;
    const saidaStr = `${String(Math.floor(saidaMin / 60) % 24).padStart(2, "0")}:${String(saidaMin % 60).padStart(2, "0")}`;

    const msg =
      `📅 *Novo agendamento* - ${empresa}\n\n` +
      `Cliente: ${clienteNome}\n` +
      `Serviço: ${agendamento.servico}\n` +
      `Data: ${fmtData(agendamento.data, agendamento.hora_inicio)}\n` +
      `Deslocamento: ${desloc} min\n` +
      `Saída prevista: ${saidaStr}`;

    const donoJid = `${donoTelefone}@s.whatsapp.net`;
    await sendMessage(instanceRecord.instance_name, donoJid, msg);
    console.log(`📩 Notificação de agendamento enviada para ${donoTelefone}`);
  } catch (err) {
    console.error(`Erro ao notificar dono sobre agendamento:`, err);
  }
}
