import { generateResponse, IaConfig, BusinessHours, ServicoCatalogo, ProductTier } from "../../lib/gemini.js";
import { sendAndStore } from "./media.js";
import { tryCriarAgendamento, tryCancelarAgendamento, tryReagendarAgendamento, notificarDono, ALL_MARKERS } from "./agendamento.js";
import { checkAndRegisterLead } from "../leadQualificator.js";

const FALLBACK_RESPONSE = "Poxa, tive uma instabilidade aqui! Pode me explicar de novo o que precisa? 😊";

export async function processWithAi(
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
