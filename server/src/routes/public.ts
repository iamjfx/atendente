import { Router, Request, Response } from "express";
import { db } from "../lib/db.js";
import { sendMessage } from "../lib/evolution.js";
import { config } from "../config.js";

const router = Router();

function apiKeyAuth(req: Request, res: Response, next: () => void) {
  const key = req.headers["x-api-key"] || req.headers["apikey"];
  if (key !== config.publicApiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

router.get("/agenda/:account_id/:data", async (req: Request, res: Response) => {
  const { account_id, data } = req.params;

  if (!account_id || !data) {
    return res.status(400).json({ error: "account_id e data são obrigatórios" });
  }

  const dateObj = new Date(data + "T12:00:00");
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ error: "Data inválida" });
  }

  const diaSemana = dateObj.getDay();

  const { data: hours } = await db
    .from("business_hours")
    .select("*")
    .eq("user_id", account_id)
    .eq("dia_semana", diaSemana)
    .eq("ativo", true)
    .maybeSingle();

  if (!hours || !hours.abre || !hours.fecha) {
    return res.json({ disponivel: false, horarios: [], servicos: [], motivo: "Sem horários disponíveis neste dia" });
  }

  const { data: servicos } = await db
    .from("servicos_catalogo")
    .select("*")
    .eq("user_id", account_id)
    .eq("ativo", true);

  const { data: agendamentos } = await db
    .from("agendamentos")
    .select("hora_inicio, hora_fim, servico")
    .eq("user_id", account_id)
    .eq("data", data)
    .not("status", "eq", "cancelled");

  const occupied: { inicio: string; fim: string }[] = (agendamentos || []).map((a: any) => ({
    inicio: a.hora_inicio,
    fim: a.hora_fim,
  }));

  const [abreH, abreM] = hours.abre.split(":").map(Number);
  const [fechaH, fechaM] = hours.fecha.split(":").map(Number);
  const abreMin = abreH * 60 + abreM;
  const fechaMin = fechaH * 60 + fechaM;

  const { data: iaCfg } = await db
    .from("ia_configs")
    .select("deslocamento_minutos")
    .eq("account_id", account_id)
    .maybeSingle();
  const deslocamentoMin = iaCfg?.deslocamento_minutos ?? 30;

  const maxDuracao = Math.max(
    ...(servicos || []).map((s: any) => s.duracao_minutos || 60),
    60
  );
  const slotDuration = maxDuracao + deslocamentoMin;

  const slots: string[] = [];
  for (let start = abreMin; start + slotDuration <= fechaMin; start += slotDuration) {
    const h = Math.floor(start / 60);
    const m = start % 60;
    const slotInicio = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const slotFimMin = start + slotDuration;
    const hFim = Math.floor(slotFimMin / 60);
    const mFim = slotFimMin % 60;
    const slotFim = `${String(hFim).padStart(2, "0")}:${String(mFim).padStart(2, "0")}`;

    const conflito = occupied.some((o) => {
      return slotInicio < o.fim && slotFim > o.inicio;
    });

    if (!conflito) {
      slots.push(slotInicio);
    }
  }

  res.json({
    disponivel: slots.length > 0,
    horarios: slots,
    servicos: servicos || [],
    data,
    dia_semana: diaSemana,
    deslocamento_minutos: deslocamentoMin,
    duracao_slot: slotDuration,
  });
});

router.post("/agendamentos", apiKeyAuth, async (req: Request, res: Response) => {
  const { account_id, servico, data, hora_inicio, nome, telefone } = req.body;

  if (!account_id || !servico || !data || !hora_inicio || !nome || !telefone) {
    return res.status(400).json({ error: "Campos obrigatórios: account_id, servico, data, hora_inicio, nome, telefone" });
  }

  const phoneStr = telefone.replace(/[^0-9]/g, "").slice(0, 11);

  // Verifica duplicidade
  const { data: existente } = await db
    .from("agendamentos")
    .select("id")
    .eq("user_id", account_id)
    .eq("telefone", phoneStr)
    .eq("data", data)
    .eq("hora_inicio", hora_inicio)
    .not("status", "eq", "cancelled")
    .maybeSingle();

  if (existente) {
    return res.status(409).json({ error: "Já existe um agendamento neste horário" });
  }

  // Carrega duração do serviço
  const { data: servicoInfo } = await db
    .from("servicos_catalogo")
    .select("duracao_minutos")
    .eq("user_id", account_id)
    .eq("nome", servico)
    .maybeSingle();
  const duracaoMin = servicoInfo?.duracao_minutos || 60;

  // Carrega deslocamento
  const { data: iaCfg } = await db
    .from("ia_configs")
    .select("deslocamento_minutos")
    .eq("account_id", account_id)
    .maybeSingle();
  const deslocamento = iaCfg?.deslocamento_minutos ?? 30;

  const [h, m] = hora_inicio.split(":").map(Number);
  const totalMin = h * 60 + m + duracaoMin;
  const horaFim = `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

  // Cria ou busca cliente
  const { data: existingClient } = await db
    .from("clientes")
    .select("id")
    .eq("user_id", account_id)
    .eq("telefone", phoneStr)
    .maybeSingle();

  let clienteId: string | null = existingClient?.id || null;
  if (!clienteId) {
    const { data: newClient } = await db
      .from("clientes")
      .insert({
        user_id: account_id,
        nome,
        telefone: phoneStr,
      })
      .select("id")
      .single();
    clienteId = newClient?.id || null;
  }

  const { data: agendamento, error } = await db
    .from("agendamentos")
    .insert({
      user_id: account_id,
      cliente_id: clienteId,
      cliente_nome: nome,
      telefone: phoneStr,
      data,
      hora_inicio,
      hora_fim: horaFim,
      servico,
      status: "confirmed",
      observacoes: deslocamento ? `Deslocamento: ${deslocamento} min` : null,
    })
    .select()
    .single();

  if (error) {
    console.error(`Erro ao criar agendamento público:`, error.message);
    return res.status(500).json({ error: "Erro ao criar agendamento" });
  }

  // Notifica o dono
  try {
    await notificarDono(account_id, { servico, data, hora_inicio, deslocamento_minutos: deslocamento }, telefone, nome);
  } catch (err) {
    console.error("Erro ao notificar dono:", err);
  }

  res.json({ success: true, agendamento });
});

async function notificarDono(
  accountId: string,
  agendamento: { servico: string; data: string; hora_inicio: string; deslocamento_minutos?: number },
  remoteJid: string,
  pushName?: string
) {
  const { data: profile } = await db
    .from("profiles")
    .select("telefone, nome_fantasia")
    .eq("id", accountId)
    .maybeSingle();

  const donoTelefone = profile?.telefone;
  if (!donoTelefone) return;

  const { data: instance } = await db
    .from("evolution_instances")
    .select("instance_name")
    .eq("account_id", accountId)
    .maybeSingle();

  if (!instance) return;

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
  await sendMessage(instance.instance_name, donoJid, msg);
  console.log(`📩 Notificação de agendamento público enviada para ${donoTelefone}`);
}

function fmtData(data: string, hora: string): string {
  const d = new Date(data + "T12:00:00");
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes} às ${hora}hs`;
}

export default router;
