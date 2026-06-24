import { supabase } from "../lib/supabase.js";
import { sendMessage, downloadMedia } from "../lib/evolution.js";
import { generateResponse } from "../lib/gemini.js";
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

async function ensureConversation(instanceId: string, remoteJid: string, accountId: string, pushName?: string) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, status")
    .eq("instance_id", instanceId)
    .eq("remote_jid", remoteJid)
    .single();

  if (existing) return { id: existing.id, status: existing.status };

  const { data: newConv, error } = await supabase
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
  const { error } = await supabase.from("messages").insert({
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
    const { data: conv } = await supabase
      .from("conversations")
      .select("unread_count")
      .eq("id", conversationId)
      .single();

    const current = (conv as { unread_count: number } | null)?.unread_count ?? 0;
    update.unread_count = current + 1;
  }

  await supabase.from("conversations").update(update).eq("id", conversationId);
}

async function loadHistory(conversationId: string, instanceName: string): Promise<{ role: "user" | "model"; parts: string }[]> {
  const { data: messages } = await supabase
    .from("messages")
    .select("from_me, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (!messages) return [];

  return messages.map((m: any) => ({
    role: m.from_me ? "model" : "user" as const,
    parts: m.content || "",
  }));
}

async function processAudio(
  instanceName: string,
  instanceRecord: { id: string; account_id: string; instance_name: string; assistantName?: string; businessName?: string },
  remoteJid: string,
  message: Record<string, unknown>,
  pushName?: string
) {
  const { id: conversationId, status } = await ensureConversation(
    instanceRecord.id,
    remoteJid,
    instanceRecord.account_id,
    pushName
  );

  await storeMessage(conversationId, remoteJid, instanceRecord.id, false, "[Áudio]");
  await updateConversationPreview(conversationId, "[Áudio]", false);

  if (status === "archived") {
    console.log(`Conversa ${conversationId} silenciada para IA (manual/arquivada)`);
    return { handled: true, responded: false, reason: "manual_mode" };
  }

  let audioInline: { mimeType: string; data: string } | null = null;
  try {
    const media = await downloadMedia(instanceName, message);
    if (media?.data && media?.mimeType) {
      audioInline = { mimeType: media.mimeType, data: media.data };
    }
  } catch (err) {
    console.error(`Falha ao baixar áudio de ${remoteJid}:`, err);
  }

  if (!audioInline) {
    const fallback = "Recebi seu áudio! Infelizmente não consegui processá-lo no momento. Pode me enviar uma mensagem de texto? :)";

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      remote_jid: remoteJid,
      instance_id: instanceRecord.id,
      from_me: true,
      content: fallback,
      ai_processed: false,
    });

    await sendMessage(instanceRecord.instance_name, remoteJid, fallback);
    await updateConversationPreview(conversationId, fallback, true);

    console.log(`Resposta fallback para áudio enviada para ${remoteJid}`);
    return { handled: true, responded: true, type: "audio_fallback" };
  }

  const history = await loadHistory(conversationId, instanceName);

  history.push({
    role: "user",
    parts: "O cliente enviou uma mensagem de áudio. Transcreva e responda adequadamente.",
  });

  console.log(`Processando áudio do Gemini para ${remoteJid}`);
  const aiResponse = await generateResponse(
    history,
    pushName,
    audioInline,
    instanceRecord.assistantName,
    instanceRecord.businessName
  );

  if (!aiResponse || aiResponse.trim().length === 0) {
    console.log(`IA retornou resposta vazia para áudio de ${remoteJid}`);
    return { handled: true, responded: false, reason: "empty_response" };
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    remote_jid: remoteJid,
    instance_id: instanceRecord.id,
    from_me: true,
    content: aiResponse,
    ai_processed: true,
  });

  await sendMessage(instanceRecord.instance_name, remoteJid, aiResponse);
  await updateConversationPreview(conversationId, aiResponse, true);

  const updatedHistory = [...history, { role: "model" as const, parts: aiResponse }];
  checkAndRegisterLead(conversationId, remoteJid, instanceRecord.account_id, updatedHistory).catch((err) => {
    console.error("Erro na qualificação assíncrona do áudio:", err);
  });

  console.log(`Resposta IA para áudio enviada para ${remoteJid}: "${aiResponse.slice(0, 60)}..."`);
  return { handled: true, responded: true, type: "audio" };
}

async function processImage(
  instanceName: string,
  instanceRecord: { id: string; account_id: string; instance_name: string; assistantName?: string; businessName?: string },
  remoteJid: string,
  message: Record<string, unknown>,
  pushName?: string
) {
  const { id: conversationId, status } = await ensureConversation(
    instanceRecord.id,
    remoteJid,
    instanceRecord.account_id,
    pushName
  );

  await storeMessage(conversationId, remoteJid, instanceRecord.id, false, "[Imagem]");
  await updateConversationPreview(conversationId, "[Imagem]", false);

  if (status === "archived") {
    console.log(`Conversa ${conversationId} silenciada para IA (manual/arquivada)`);
    return { handled: true, responded: false, reason: "manual_mode" };
  }

  let imageInline: { mimeType: string; data: string } | null = null;
  try {
    const media = await downloadMedia(instanceName, message);
    if (media?.data && media?.mimeType) {
      imageInline = { mimeType: media.mimeType, data: media.data };
    }
  } catch (err) {
    console.error(`Falha ao baixar imagem de ${remoteJid}:`, err);
  }

  if (!imageInline) {
    const fallback = "Recebi sua imagem! Infelizmente não consegui visualizá-la no momento. Pode me descrever o problema?";

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      remote_jid: remoteJid,
      instance_id: instanceRecord.id,
      from_me: true,
      content: fallback,
      ai_processed: false,
    });

    await sendMessage(instanceRecord.instance_name, remoteJid, fallback);
    await updateConversationPreview(conversationId, fallback, true);

    console.log(`Resposta fallback para imagem enviada para ${remoteJid}`);
    return { handled: true, responded: true, type: "image_fallback" };
  }

  const history = await loadHistory(conversationId, instanceName);

  history.push({
    role: "user",
    parts: "O cliente enviou uma imagem do local/problema. Analise e responda adequadamente.",
  });

  console.log(`Processando imagem do Gemini para ${remoteJid}`);
  const aiResponse = await generateResponse(
    history,
    pushName,
    imageInline,
    instanceRecord.assistantName,
    instanceRecord.businessName
  );

  if (!aiResponse || aiResponse.trim().length === 0) {
    console.log(`IA retornou resposta vazia para imagem de ${remoteJid}`);
    return { handled: true, responded: false, reason: "empty_response" };
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    remote_jid: remoteJid,
    instance_id: instanceRecord.id,
    from_me: true,
    content: aiResponse,
    ai_processed: true,
  });

  await sendMessage(instanceRecord.instance_name, remoteJid, aiResponse);
  await updateConversationPreview(conversationId, aiResponse, true);

  const updatedHistory = [...history, { role: "model" as const, parts: aiResponse }];
  checkAndRegisterLead(conversationId, remoteJid, instanceRecord.account_id, updatedHistory).catch((err) => {
    console.error("Erro na qualificação assíncrona da imagem:", err);
  });

  console.log(`Resposta IA para imagem enviada para ${remoteJid}: "${aiResponse.slice(0, 60)}..."`);
  return { handled: true, responded: true, type: "image" };
}

async function processText(
  instanceName: string,
  instanceRecord: { id: string; account_id: string; instance_name: string; assistantName?: string; businessName?: string },
  remoteJid: string,
  content: string,
  pushName?: string
) {
  const { id: conversationId, status } = await ensureConversation(
    instanceRecord.id,
    remoteJid,
    instanceRecord.account_id,
    pushName
  );

  await storeMessage(conversationId, remoteJid, instanceRecord.id, false, content);
  await updateConversationPreview(conversationId, content, false);

  if (status === "archived") {
    console.log(`Conversa ${conversationId} silenciada para IA (manual/arquivada)`);
    return { handled: true, responded: false, reason: "manual_mode" };
  }

  const history = await loadHistory(conversationId, instanceName);
  history.push({ role: "user", parts: content });

  console.log(`Gerando resposta IA para ${remoteJid} (conv: ${conversationId})`);
  const aiResponse = await generateResponse(
    history,
    pushName,
    undefined,
    instanceRecord.assistantName,
    instanceRecord.businessName
  );

  if (!aiResponse || aiResponse.trim().length === 0) {
    console.log(`IA retornou resposta vazia para ${remoteJid}`);
    return { handled: true, responded: false, reason: "empty_response" };
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    remote_jid: remoteJid,
    instance_id: instanceRecord.id,
    from_me: true,
    content: aiResponse,
    ai_processed: true,
  });

  await sendMessage(instanceRecord.instance_name, remoteJid, aiResponse);
  await updateConversationPreview(conversationId, aiResponse, true);

  const updatedHistory = [...history, { role: "model" as const, parts: aiResponse }];
  checkAndRegisterLead(conversationId, remoteJid, instanceRecord.account_id, updatedHistory).catch((err) => {
    console.error("Erro na qualificação assíncrona do texto:", err);
  });

  console.log(`Resposta enviada para ${remoteJid}: "${aiResponse.slice(0, 60)}..."`);
  return { handled: true, responded: true };
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

  const { data: instanceRecord } = await supabase
    .from("evolution_instances")
    .select("id, account_id, instance_name")
    .eq("instance_name", instance)
    .single();

  if (!instanceRecord) {
    console.log(`Instancia nao encontrada: ${instance}`);
    return { handled: false, reason: "instance_not_found" };
  }

  const isAudio = !!data.message?.audioMessage;
  const isImage = !!data.message?.imageMessage;

  const { data: profileRecord } = await supabase
    .from("profiles")
    .select("nome_ia, nome_fantasia")
    .eq("id", instanceRecord.account_id)
    .single();

  const instanceWithProfile = {
    ...instanceRecord,
    assistantName: profileRecord?.nome_ia || undefined,
    businessName: profileRecord?.nome_fantasia || undefined,
  };

  if (isAudio) {
    return processAudio(
      instance,
      instanceWithProfile,
      remoteJid,
      { key: data.key, message: data.message },
      data.pushName
    );
  }

  if (isImage) {
    return processImage(
      instance,
      instanceWithProfile,
      remoteJid,
      { key: data.key, message: data.message },
      data.pushName
    );
  }

  const content = data.message?.conversation || data.message?.extendedTextMessage?.text;
  if (!content) {
    console.log(`Mensagem sem conteudo textual: ${instance}`);
    return { handled: false, reason: "no_text" };
  }

  return processText(
    instance,
    instanceWithProfile,
    remoteJid,
    content,
    data.pushName
  );
}
