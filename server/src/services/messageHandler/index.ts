import { z } from "zod";
import { db } from "../../lib/db.js";
import { getAccountProductSlugs, getProductTier } from "../../lib/products.js";
import { loadIaConfig, loadBusinessHours, loadServicos, ensureConversation, storeMessage, updateConversationPreview, loadHistory, buildMessageLabel } from "./db.js";
import { handleMediaMessage } from "./media.js";
import { processWithAi } from "./ai.js";
import { checkRecurringClient } from "./client.js";
import { sendAndStore } from "./media.js";

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

export async function handleIncomingMessage(payload: unknown) {
  const parsed = webhookSchema.parse(payload);
  const { instance, data } = parsed;
  const remoteJid = data.key.remoteJid;

  // Busca instanceRecord ANTES para ter account_id
  const { data: instanceRecord } = await db
    .from("evolution_instances")
    .select("id, account_id, instance_name")
    .eq("instance_name", instance)
    .single();

  if (!instanceRecord) {
    console.log(`Instancia nao encontrada: ${instance}`);
    return { handled: false, reason: "instance_not_found" };
  }

  // Mensagens enviadas pelo próprio dono (via WhatsApp)
  if (data.key.fromMe) {
    const { data: existing } = await db
      .from("conversations")
      .select("id")
      .eq("instance_id", instanceRecord.id)
      .eq("remote_jid", remoteJid)
      .maybeSingle();

    if (existing) {
      // IA já estava atuando — armazena como intervenção humana
      const content = (data.message as any)?.conversation || (data.message as any)?.extendedTextMessage?.text;
      if (content) {
        await storeMessage(existing.id, remoteJid, instanceRecord.id, true, content);
        await updateConversationPreview(existing.id, content, true);
      }
      await db
        .from("conversations")
        .update({ ai_resolved: false, status: "archived" })
        .eq("id", existing.id);
      console.log(`Intervenção humana registrada (fromMe): ${remoteJid}`);
      return { handled: true, responded: false, reason: "owner_intervention" };
    }

    // Conversa nova iniciada pelo dono — não armazena
    return { handled: false, reason: "owner_new_message" };
  }

  if (remoteJid.includes("@g.us")) {
    console.log(`Ignorando mensagem de grupo: ${remoteJid}`);
    return { handled: false, reason: "group" };
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
        .insert({ account_id: instanceRecord.account_id, autonomy_level: "full", collect_name: true, collect_phone: false, collect_service: true, collect_address: true, deslocamento_minutos: 30 });
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
      await sendAndStore(instanceRecord, remoteJid, conversationId, "Poxa, tive uma instabilidade aqui! Pode me explicar de novo o que precisa? 😊", false);
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

  // Conversa bloqueada na IA — descarta completamente
  if (status === "blocked") {
    console.log(`Conversa ${conversationId} bloqueada na IA — mensagem ignorada`);
    return { handled: false, responded: false, reason: "blocked" };
  }

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
