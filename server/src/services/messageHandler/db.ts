import { db } from "../../lib/db.js";
import { IaConfig, BusinessHours, ServicoCatalogo } from "../../lib/gemini.js";

export async function ensureConversation(instanceId: string, remoteJid: string, accountId: string, pushName?: string) {
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

export async function storeMessage(
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

export async function updateConversationPreview(conversationId: string, preview: string, isFromMe: boolean) {
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

const BAD_PATTERNS = [
  "alguém vai entrar em contato",
  "vai retornar",
  "vou transferir",
  "especialistas entrará em contato",
  "aguardando sua mensagem",
  "histórico limpo",
  "recebi sua mensagem",
];

export async function loadHistory(conversationId: string, _instanceName: string): Promise<{ role: "user" | "model"; parts: string }[]> {
  const { data: messages } = await db
    .from("messages")
    .select("from_me, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (!messages) return [];

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

export async function loadIaConfig(accountId: string) {
  const { data: config } = await db
    .from("ia_configs")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();
  return config as IaConfig | null;
}

export async function loadBusinessHours(accountId: string) {
  const { data: hours } = await db
    .from("business_hours")
    .select("*")
    .eq("user_id", accountId)
    .order("dia_semana", { ascending: true });
  return hours as BusinessHours[] | null;
}

export async function loadServicos(accountId: string) {
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

export function buildMessageLabel(message: Record<string, unknown>): string {
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
