import { db } from "../lib/db.js";
import { sendMessage, downloadMedia } from "../lib/evolution.js";
import { generateResponse, IaConfig, BusinessHours, ServicoCatalogo, ProductTier } from "../lib/gemini.js";
import { getAccountProductSlugs, getProductTier } from "../lib/products.js";
import { z } from "zod";
import { checkAndRegisterLead } from "./leadQualificator.js";

const webhookSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z.object({ text: z.string() }).optional(),
      audioMessage: z.any().optional(),
      imageMessage: z.any().optional(),
    }).optional(),
    pushName: z.string().optional(),
    messageType: z.string().optional(),
  }),
});

export type WebhookPayload = z.infer<typeof webhookSchema>;

const FALLBACK_RESPONSE = "Poxa, tive uma instabilidade aqui! Pode me explicar de novo o que precisa? 😊";

async function ensureConversation(instanceId: string, remoteJid: string, accountId: string, pushName?: string) {
  const { data: existing } = await db
    .from("conversations")
    .select("id, status")
    .eq("instance_id", instanceId)
    .eq("remote_jid", remoteJid)
    .single();

  if (existing) return { id: existing.id, status: existing.status };

  const { data: newConv, error } = await db
    .from("conversations")
    .insert({
      account_id: accountId,
      instance_id: instanceId,
      remote_jid: remoteJid,
      contact_name: pushName || null,
      contact_phone: remoteJid.replace(/[^0-9]/g, "").slice(0, 11),
    })
    .select("id, status")
    .single();

  if (error || !newConv) throw new Error(`Failed to create conversation: ${error?.message}`);

  return { id: newConv.id, status: newConv.status };
}

async function storeMessage(
  conversationId: string,
  remoteJid: string,
  instanceId: string,
  fromMe: boolean,
  content: string
) {
  const { error } = await db.from("messages").insert({
    conversation_id: conversationId,
    remote_jid: remoteJid,
    instance_id: instanceId,
    from_me: fromMe,
    content,
  });

  if (error) throw new Error(`Failed to store message: ${error.message}`);
}

async function updateConversationPreview(conversationId: string, preview: string, isFromMe: boolean) {
  const update: Record<string, unknown> = {
    last_message_preview: preview.slice(0, 100),
    last_message_at: new Date().toISOString(),
  };

  if (!isFromMe) {
    const { data: conv } = await db
      .from("conversations")
      .select("unread_count")
      .eq("id", conversationId)
      .single();

    const current = (conv as { unread_count: number } | null)?.unread_count ?? 0;
    update.unread_count = current + 1;
  }

  await db.from("conversations").update(update).eq("id", conversationId);
}

async function loadHistory(conversationId: string, _instanceName: string): Promise<{ role: "user" | "model"; parts: string }[]> {
  const { data: messages } = await db
    .from("messages")
    .select("from_me, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (!messages) return [];

  const BAD_PATTERNS = [
    "alguém vai entrar em contato",
    "vai retornar",
    "vou transferir",
    "especialistas entrará em contato",
    "aguardando sua mensagem",
    "histórico limpo",
    "recebi sua mensagem",
  ];

  return messages
    .filter((m: any) => {
      if (!m.from_me) return true;
      const content = (m.content || "").toLowerCase();
      return !BAD_PATTERNS.some((p) => content.includes(p));
    })
    .map((m: any) => ({
      role: m.from_me ? "model" : "user" as const,
      parts: m.content || "",
    }));
}

async function loadIaConfig(accountId: string) {
  const { data: config } = await db
    .from("ia_configs")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();
  return config as IaConfig | null;
}

async function loadBusinessHours(accountId: string) {
  const { data: hours } = await db
    .from("business_hours")
    .select("*")
    .eq("user_id", accountId)
    .order("dia_semana", { ascending: true });
  return hours as BusinessHours[] | null;
}

async function loadServicos(accountId: string) {
  const { data: servicos } = await db
    .from("servicos_catalogo")
    .select("*")
    .eq("user_id", accountId)
    .eq("ativo", true);
  if (!servicos) return null;
  return (servicos as any[]).map((s) => ({
    id: s.id,
    nome: s.nome,
    duracao_minutos: s.duracao_minutos ?? null,
    preco: s.valor_padrao ?? null,
  })) as ServicoCatalogo[];
}

function buildMessageLabel(message: Record<string, unknown>): string {
  if (message.audioMessage) return "[Áudio]";
  if (message.imageMessage) return "[Imagem]";
  if (message.videoMessage) return "[Vídeo]";
  if (message.documentMessage) return "[Documento]";
  if (message.locationMessage) return "[Localização]";
  if (message.contactMessage) return "[Contato]";
  if (message.stickerMessage) return "[Figurinha]";
  if (message.reactionMessage) return "[Reação]";
  return "[Mensagem]";
}

async function sendAndStore(
  instanceRecord: { id: string; account_id: string; instance_name: string },
  remoteJid: string,
  conversationId: string,
  text: string,
  aiProcessed: boolean
) {
  await db.from("messages").insert({
    conversation_id: conversationId,
    remote_jid: remoteJid,
    instance_id: instanceRecord.id,
    from_me: true,
    content: text,
    ai_processed: aiProcessed,
  });

  await sendMessage(instanceRecord.instance_name, remoteJid, text);
  await updateConversationPreview(conversationId, text, true);
}

const AGENDAR_REGEX = /📅\s*AGENDAR\|\s*([^|]+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{2}:\d{2})(?:\|\s*(\d+))?/;
const CANCELAR_REGEX = /📅\s*CANCELAR\|\s*(.+)/;
const REAGENDAR_REGEX = /📅\s*REAGENDAR\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{2}:\d{2})/;
const ALL_MARKERS = /📅\s*(?:AGENDAR|CANCELAR|REAGENDAR)\|.*/g;

async function tryCriarAgendamento(
  aiResponse: string,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  conversationId: string,
  remoteJid: string,
  pushName?: string
) {
  const match = aiResponse.match(AGENDAR_REGEX);
  if (!match) return null;

  const servico = match[1].trim();
  const data = match[2];
  const horaInicio = match[3];
  const deslocamentoMin = match[4] ? parseInt(match[4]) : null;

  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

  // Carrega deslocamento_minutos da config (ou default 30)
  let deslocamento = deslocamentoMin ?? 30;
  if (!deslocamentoMin) {
    const { data: cfg } = await db
      .from("ia_configs")
      .select("deslocamento_minutos")
      .eq("account_id", instanceRecord.account_id)
      .maybeSingle();
    deslocamento = cfg?.deslocamento_minutos ?? 30;
  }

  // Busca duração do serviço no catálogo
  const { data: servicoInfo } = await db
    .from("servicos_catalogo")
    .select("duracao_minutos")
    .eq("user_id", instanceRecord.account_id)
    .eq("nome", servico)
    .maybeSingle();

  const duracaoMin = servicoInfo?.duracao_minutos || 60;

  // Calcula hora_fim = hora_inicio + duracao do serviço
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

async function tryCancelarAgendamento(
  aiResponse: string,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  conversationId: string,
  remoteJid: string,
  pushName?: string
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

  const { error } = await db
    .from("agendamentos")
    .update({ status: "cancelled" })
    .eq("id", agenda.id);

  if (error) {
    console.error(`Erro ao cancelar agendamento:`, error.message);
    return null;
  }

  console.log(`❌ Agendamento cancelado (${motivo}): ${agenda.servico} em ${agenda.data} às ${agenda.hora_inicio}`);
  return agenda;
}

async function tryReagendarAgendamento(
  aiResponse: string,
  instanceRecord: { id: string; account_id: string; instance_name: string },
  conversationId: string,
  remoteJid: string,
  pushName?: string
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
    .update({
      data: novaData,
      hora_inicio: novoHorario,
      hora_fim: novaHoraFim,
      status: "confirmed",
    })
    .eq("id", agenda.id);

  if (error) {
    console.error(`Erro ao reagendar:`, error.message);
    return null;
  }

  console.log(`🔄 Agendamento reagendado: ${agenda.servico} de ${agenda.data} ${agenda.hora_inicio} → ${novaData} ${novoHorario}`);
  return { ...agenda, nova_data: novaData, novo_horario: novoHorario };
}

async function notificarDono(
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

    const msg = `📅 *Novo agendamento* - ${empresa}\n\n` +
      `Cliente: ${clienteNome}\n` +
      `Serviço: ${agendamento.servico}\n` +
      `Data: ${agendamento.data}\n` +
      `Horário: ${agendamento.hora_inicio}\n` +
      `Deslocamento: ${desloc} min\n` +
      `Saída prevista: ${saidaStr}`;

    const donoJid = `${donoTelefone}@s.whatsapp.net`;
    await sendMessage(instanceRecord.instance_name, donoJid, msg);
    console.log(`📩 Notificação de agendamento enviada para ${donoTelefone}`);
  } catch (err) {
    console.error(`Erro ao notificar dono sobre agendamento:`, err);
  }
}

async function checkRecurringClient(
  accountId: string,
  remoteJid: string
): Promise<string | null> {
  const phoneStr = remoteJid.replace(/[^0-9]/g, "").slice(0, 11);

  const { data: lastVisit } = await db
    .from("agendamentos")
    .select("servico, data")
    .eq("user_id", accountId)
    .eq("telefone", phoneStr)
    .in("status", ["confirmed", "completed"])
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastVisit) {
    return `(Contexto: este cliente já foi atendido anteriormente para "${lastVisit.servico}" em ${lastVisit.data}. Trate com familiaridade.)`;
  }

  const { data: lastOrc } = await db
    .from("orcamentos")
    .select("servico")
    .eq("user_id", accountId)
    .eq("telefone", phoneStr)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOrc) {
    return `(Contexto: este cliente já solicitou orçamento para "${lastOrc.servico}" anteriormente.)`;
  }

  return null;
}

async function processWithAi(
  instanceName: string,
  instanceRecord: { id: string; account_id: string; instance_name: string; assistantName?: string; businessName?: string },
  remoteJid: string,
  pushName: string | undefined,
  conversationId: string,
  history: { role: "user" | "model"; parts: string }[],
  mediaInline?: { mimeType: string; data: string },
  iaConfig?: IaConfig | null,
  businessHours?: BusinessHours[] | null,
  servicos?: ServicoCatalogo[] | null,
  productTier?: ProductTier
): Promise<{ responded: boolean; type?: string }> {
  console.log(`Gerando resposta IA para ${remoteJid} (conv: ${conversationId}) [tier: ${productTier || "basic"}, autonomy: ${iaConfig?.autonomy_level || "full(default)"}]`);

  const hasScheduleConfig = !!(businessHours && businessHours.some(bh => bh.ativo && bh.abre) && servicos && servicos.length > 0);

  let aiResponse: string;
  try {
    aiResponse = await generateResponse(
      history,
      pushName,
      mediaInline,
      instanceRecord.assistantName,
      instanceRecord.businessName,
      iaConfig,
      businessHours,
      servicos,
      hasScheduleConfig,
      productTier
    );
  } catch (err) {
    console.error(`Erro ao gerar resposta IA para ${remoteJid}:`, err);
    console.log(`⚠️ Usando FALLBACK_RESPONSE: "${FALLBACK_RESPONSE}"`);
    await sendAndStore(instanceRecord, remoteJid, conversationId, FALLBACK_RESPONSE, false);
    return { responded: true, type: "fallback" };
  }

  if (!aiResponse || aiResponse.trim().length === 0) {
    console.log(`IA retornou resposta vazia para ${remoteJid}`);
    await sendAndStore(instanceRecord, remoteJid, conversationId, FALLBACK_RESPONSE, false);
    return { responded: true, type: "fallback" };
  }

  const forbiddenPatterns = ["alguém vai", "vai retornar", "recebi sua mensagem"];
  const lower = aiResponse.toLowerCase();
  if (forbiddenPatterns.some(p => lower.includes(p))) {
    console.log(`⚠️ IA retornou resposta proibida (processWithAi level), enviando fallback...`);
    await sendAndStore(instanceRecord, remoteJid, conversationId, FALLBACK_RESPONSE, false);
    return { responded: true, type: "fallback" };
  }

  const cleanResponse = aiResponse.replace(ALL_MARKERS, "").replace(/\n{2,}/g, "\n").trim();

  await sendAndStore(instanceRecord, remoteJid, conversationId, cleanResponse, true);

  const agendamento = await tryCriarAgendamento(aiResponse, instanceRecord, conversationId, remoteJid, pushName);
  if (agendamento) {
    const confirmacao = `✅ Agendamento confirmado! ${agendamento.servico} em ${agendamento.data} às ${agendamento.hora_inicio}.`;
    await sendAndStore(instanceRecord, remoteJid, conversationId, confirmacao, true);
    notificarDono(instanceRecord, agendamento, remoteJid, pushName);
  }

  const cancelamento = await tryCancelarAgendamento(aiResponse, instanceRecord, conversationId, remoteJid, pushName);
  if (cancelamento) {
    const msg = `❌ Agendamento de ${cancelamento.servico} (${cancelamento.data} às ${cancelamento.hora_inicio}) cancelado conforme solicitado.`;
    await sendAndStore(instanceRecord, remoteJid, conversationId, msg, true);
  }

  const reagendamento = await tryReagendarAgendamento(aiResponse, instanceRecord, conversationId, remoteJid, pushName);
  if (reagendamento) {
    const msg = `🔄 Agendamento de ${reagendamento.servico} remarcado para ${reagendamento.nova_data} às ${reagendamento.novo_horario}.`;
    await sendAndStore(instanceRecord, remoteJid, conversationId, msg, true);
  }

  const updatedHistory = [...history, { role: "model" as const, parts: cleanResponse }];
  if (productTier === "complete") {
    checkAndRegisterLead(conversationId, remoteJid, instanceRecord.account_id, updatedHistory).catch((err) => {
      console.error("Erro na qualificação assíncrona:", err);
    });
  }

  console.log(`Resposta enviada para ${remoteJid}: "${cleanResponse.slice(0, 60)}..."`);
  const action = reagendamento ? "reagendamento" : cancelamento ? "cancelamento" : agendamento ? "agendamento" : null;
  if (action) console.log(`🎯 ${action} via IA para ${remoteJid}`);
  return { responded: true, type: action ? `ai_${action}` : "ai" };
}

async function handleMediaMessage(
  instanceName: string,
  instanceRecord: { id: string; account_id: string; instance_name: string; assistantName?: string; businessName?: string },
  remoteJid: string,
  pushName: string | undefined,
  message: Record<string, unknown>,
  isAudio: boolean,
  iaConfig?: IaConfig | null,
  businessHours?: BusinessHours[] | null,
  servicos?: ServicoCatalogo[] | null,
  productTier?: ProductTier
) {
  const { id: conversationId, status } = await ensureConversation(
    instanceRecord.id,
    remoteJid,
    instanceRecord.account_id,
    pushName
  );

  const label = isAudio ? "[Áudio]" : "[Imagem]";
  await storeMessage(conversationId, remoteJid, instanceRecord.id, false, label);
  await updateConversationPreview(conversationId, label, false);

  if (status === "archived") {
    console.log(`Conversa ${conversationId} silenciada para IA (manual/arquivada)`);
    return { handled: true, responded: false, reason: "manual_mode" };
  }

  let mediaInline: { mimeType: string; data: string } | null = null;
  try {
    const media = await downloadMedia(instanceName, message);
    if (media?.data && media?.mimeType) {
      mediaInline = { mimeType: media.mimeType, data: media.data };
    }
  } catch (err) {
    console.error(`Falha ao baixar mídia de ${remoteJid}:`, err);
  }

  if (!mediaInline) {
    const fallback = isAudio
      ? "Recebi seu áudio! Não consegui ouvir agora. Pode me explicar em texto o que precisa? :)"
      : "Recebi sua imagem! Não consegui visualizar agora. Pode me descrever o problema em texto?";

    await sendAndStore(instanceRecord, remoteJid, conversationId, fallback, false);
    console.log(`Resposta fallback para ${isAudio ? "áudio" : "imagem"} enviada para ${remoteJid}`);
    return { handled: true, responded: true, type: `${isAudio ? "audio" : "image"}_fallback` };
  }

  const history = await loadHistory(conversationId, instanceName);
  history.push({
    role: "user",
    parts: isAudio
      ? "O cliente enviou uma mensagem de áudio. Transcreva e responda adequadamente."
      : "O cliente enviou uma imagem. Analise a imagem e dê um PRÉ-DIAGNÓSTICO do problema visível. Depois pergunte mais detalhes e ofereça uma solução.",
  });

  return processWithAi(instanceName, instanceRecord, remoteJid, pushName, conversationId, history, mediaInline, iaConfig, businessHours, servicos, productTier);
}

export async function handleIncomingMessage(payload: unknown) {
  const parsed = webhookSchema.parse(payload);
  const { instance, data } = parsed;

  if (data.key.fromMe) {
    console.log(`Ignorando mensagem de saída (fromMe=true): ${instance}`);
    return { handled: false, reason: "own_message" };
  }

  const remoteJid = data.key.remoteJid;

  if (remoteJid.includes("@g.us")) {
    console.log(`Ignorando mensagem de grupo: ${remoteJid}`);
    return { handled: false, reason: "group" };
  }

  const { data: instanceRecord } = await db
    .from("evolution_instances")
    .select("id, account_id, instance_name")
    .eq("instance_name", instance)
    .single();

  if (!instanceRecord) {
    console.log(`Instancia nao encontrada: ${instance}`);
    return { handled: false, reason: "instance_not_found" };
  }

  const { data: profileRecord } = await db
    .from("profiles")
    .select("nome_ia, nome_fantasia")
    .eq("id", instanceRecord.account_id)
    .single();

  const [iaConfig, businessHours, servicos, productSlugs] = await Promise.all([
    loadIaConfig(instanceRecord.account_id),
    loadBusinessHours(instanceRecord.account_id),
    loadServicos(instanceRecord.account_id),
    getAccountProductSlugs(instanceRecord.account_id),
  ]);

  if (!iaConfig) {
    try {
      await db
        .from("ia_configs")
        .insert({ account_id: instanceRecord.account_id, autonomy_level: "full", collect_name: true, collect_phone: true, collect_service: true });
    } catch (_) {}
  }

  if (!businessHours || businessHours.length === 0) {
    try {
      const defaults = [1, 2, 3, 4, 5].map((dia) => ({
        user_id: instanceRecord.account_id,
        dia_semana: dia,
        abre: "08:00",
        fecha: "18:00",
        ativo: true,
      }));
      await db.from("business_hours").insert(defaults);
    } catch (_) {}
  }

  const productTier = getProductTier(productSlugs);

  const instanceWithProfile = {
    ...instanceRecord,
    assistantName: profileRecord?.nome_ia || undefined,
    businessName: profileRecord?.nome_fantasia || undefined,
  };

  const message = data.message || {};

  const isAudio = !!message.audioMessage;
  const isImage = !!message.imageMessage;

  if (isAudio || isImage) {
    return handleMediaMessage(
      instance,
      instanceWithProfile,
      remoteJid,
      data.pushName,
      { key: data.key, message },
      isAudio,
      iaConfig,
      businessHours,
      servicos,
      productTier
    );
  }

  const content = (message as any).conversation || (message as any).extendedTextMessage?.text;

  if (!content) {
    const { id: conversationId } = await ensureConversation(
      instanceRecord.id,
      remoteJid,
      instanceRecord.account_id,
      data.pushName
    );

    const label = buildMessageLabel(message);

    await storeMessage(conversationId, remoteJid, instanceRecord.id, false, label);
    await updateConversationPreview(conversationId, label, false);

    if (iaConfig?.autonomy_level === "manual") {
      await sendAndStore(instanceRecord, remoteJid, conversationId, FALLBACK_RESPONSE, false);
      return { handled: true, responded: true, type: "non_text_fallback" };
    }

    const history = await loadHistory(conversationId, instance);
    history.push({
      role: "user",
      parts: "O cliente enviou um conteúdo que não pude identificar. Peça educadamente para ele descrever em texto o que precisa.",
    });

    return processWithAi(instance, instanceWithProfile, remoteJid, data.pushName, conversationId, history, undefined, iaConfig, businessHours, servicos, productTier);
  }

  const { id: conversationId, status } = await ensureConversation(
    instanceRecord.id,
    remoteJid,
    instanceRecord.account_id,
    data.pushName
  );

  await storeMessage(conversationId, remoteJid, instanceRecord.id, false, content);
  await updateConversationPreview(conversationId, content, false);

  if (status === "archived") {
    console.log(`Conversa ${conversationId} silenciada para IA (manual/arquivada)`);
    return { handled: true, responded: false, reason: "manual_mode" };
  }

  const history = await loadHistory(conversationId, instance);

  const recurringContext = await checkRecurringClient(instanceRecord.account_id, remoteJid);
  const enrichedContent = recurringContext ? `${recurringContext}\n\nCliente: ${content}` : content;
  history.push({ role: "user", parts: enrichedContent });

  return processWithAi(instance, instanceWithProfile, remoteJid, data.pushName, conversationId, history, undefined, iaConfig, businessHours, servicos, productTier);
}
