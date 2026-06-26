import { sendMessage, downloadMedia } from "../../lib/evolution.js";
import { storeMessage, updateConversationPreview, ensureConversation, loadHistory } from "./db.js";
import { processWithAi } from "./ai.js";
import { IaConfig, BusinessHours, ServicoCatalogo, ProductTier } from "../../lib/gemini.js";

export async function sendAndStore(
  instanceRecord: { id: string; account_id: string; instance_name: string },
  remoteJid: string,
  conversationId: string,
  text: string,
  aiProcessed: boolean
) {
  await storeMessage(conversationId, remoteJid, instanceRecord.id, true, text);

  await sendMessage(instanceRecord.instance_name, remoteJid, text);
  await updateConversationPreview(conversationId, text, true);
}

export async function handleMediaMessage(
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

  // Conversa bloqueada na IA — descarta mídia também
  if (status === "blocked") {
    console.log(`Mídia ignorada — conversa ${conversationId} bloqueada na IA`);
    return { handled: false, responded: false, reason: "blocked" };
  }

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
