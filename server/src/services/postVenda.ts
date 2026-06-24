import { db } from "../lib/db.js";
import { getAccountProductSlugs, hasProduct } from "../lib/products.js";

// Interval in milliseconds to check for pending pós-venda messages (e.g., every 5 minutes)
const CHECK_INTERVAL = 5 * 60 * 1000; 

// Delay before sending the post-sale feedback message (24 hours in milliseconds)
const FEEDBACK_DELAY_MS = 24 * 60 * 60 * 1000;

export async function processPostVenda() {
  try {
    const cutoffTime = new Date(Date.now() - FEEDBACK_DELAY_MS);

    // 1. Fetch approved budgets that are older than 24 hours
    const { data: orcamentos, error } = await db
      .from("orcamentos")
      .select("*")
      .eq("status", "aprovado")
      .not("aprovado_em", "is", null)
      .lte("aprovado_em", cutoffTime.toISOString());

    if (error) {
      console.error("Pós-Venda: Erro ao buscar orçamentos aprovados:", error.message);
      return;
    }

    if (!orcamentos || orcamentos.length === 0) return;

    for (const orc of orcamentos) {
      // 1.5 Skip accounts without controletotal product
      const accountSlugs = await getAccountProductSlugs(orc.user_id);
      if (!hasProduct(accountSlugs, "controletotal")) continue;

      // 2. Fetch the instance to get account owner's Google review link
      const { data: profile } = await db
        .from("profiles")
        .select("nome_fantasia, nome_ia, ramo_outro")
        .eq("id", orc.user_id)
        .single();

      // We'll search if there's any google review link in config.
      // Standalone Atendente can save the link in the "ramo_outro" or a custom format, or env.
      const googleReviewLink = process.env.GOOGLE_REVIEW_LINK || "https://g.page/r/your-business-link/review";
      const businessName = profile?.nome_fantasia || "nossa empresa";

      // 3. Find if we already sent a feedback message to this phone number
      const { data: existingMsgs } = await db
        .from("messages")
        .select("id")
        .eq("remote_jid", `${orc.telefone}@s.whatsapp.net`)
        .like("content", "%agradecemos a confiança%")
        .limit(1);

      if (existingMsgs && existingMsgs.length > 0) {
        // Feedback message already sent
        continue;
      }

      // 4. Get active conversation for this user to append message history
      const { data: conv } = await db
        .from("conversations")
        .select("id, instance_id")
        .eq("account_id", orc.user_id)
        .eq("contact_phone", orc.telefone)
        .limit(1)
        .maybeSingle();

      if (!conv) {
        console.log(`Pós-Venda: Conversa não encontrada para telefone ${orc.telefone}. Ignorando.`);
        continue;
      }

      const feedbackText = `Olá! Agradecemos a confiança em nossos serviços na empresa ${businessName}. Se puder, avalie nosso atendimento no Google: ${googleReviewLink}. Sua opinião é muito importante para nós!`;

      console.log(`Pós-Venda: Agendando mensagem de feedback para ${orc.cliente_nome} (${orc.telefone})`);

      // 5. Insert feedback message into messages table (so it appears in chat history)
      await db.from("messages").insert({
        conversation_id: conv.id,
        remote_jid: `${orc.telefone}@s.whatsapp.net`,
        instance_id: conv.instance_id,
        from_me: true,
        content: feedbackText,
        ai_processed: true,
      });

      // 6. Insert into queue to send WhatsApp message
      await db.from("message_queue").insert({
        conversation_id: conv.id,
        instance_id: conv.instance_id,
        remote_jid: `${orc.telefone}@s.whatsapp.net`,
        content: feedbackText,
        status: "pending",
      });

      // 7. Update conversation preview
      await db
        .from("conversations")
        .update({
          last_message_preview: "Mensagem de pós-venda enviada.",
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conv.id);
    }
  } catch (err: any) {
    console.error("Erro no processamento do pós-venda:", err.message);
  }
}

let postVendaInterval: ReturnType<typeof setInterval> | null = null;

export function startPostVendaProcessor() {
  if (postVendaInterval) return;
  console.log("Processador de pós-venda automático iniciado.");
  // Run checks periodically
  postVendaInterval = setInterval(() => {
    processPostVenda().catch((err) =>
      console.error("Erro no loop de pós-venda:", err)
    );
  }, CHECK_INTERVAL);
}
