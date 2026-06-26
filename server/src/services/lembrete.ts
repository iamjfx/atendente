import { db } from "../lib/db.js";
import { getAccountProductSlugs, hasProduct } from "../lib/products.js";
import { sendMessage } from "../lib/evolution.js";

const CHECK_INTERVAL = 30 * 60 * 1000;

async function processLembretes() {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataStr = amanha.toISOString().split("T")[0];

    const { data: agendamentos } = await db
      .from("agendamentos")
      .select("id, user_id, cliente_nome, telefone, servico, data, hora_inicio, created_at, instance_id")
      .eq("data", dataStr)
      .in("status", ["confirmed", "pending"])
      .limit(50);

    if (!agendamentos || agendamentos.length === 0) return;

    for (const apt of agendamentos) {
      const slugs = await getAccountProductSlugs(apt.user_id);
      if (!hasProduct(slugs, "atendente")) continue;

      // Lê config de lembrete do usuário
      const { data: cfg } = await db
        .from("ia_configs")
        .select("lembrete_horas")
        .eq("account_id", apt.user_id)
        .maybeSingle();

      const horas = cfg?.lembrete_horas ?? 24;
      if (horas <= 0) continue; // Desligado

      // Calcula se já passou do momento de enviar
      const dataAgendamento = new Date(apt.data + "T" + apt.hora_inicio);
      const dataLembrete = new Date(dataAgendamento.getTime() - horas * 3600000);
      if (dataLembrete > new Date()) continue; // Ainda não é hora

      const { data: instance } = await db
        .from("evolution_instances")
        .select("instance_name")
        .eq("id", apt.instance_id)
        .single();

      if (!instance) continue;

      const { data: alreadySent } = await db
        .from("messages")
        .select("id")
        .eq("remote_jid", `${apt.telefone}@s.whatsapp.net`)
        .like("content", `%lembrete%${apt.id}%`)
        .limit(1);

      if (alreadySent && alreadySent.length > 0) continue;

      const { data: conv } = await db
        .from("conversations")
        .select("id")
        .eq("instance_id", apt.instance_id)
        .eq("contact_phone", apt.telefone)
        .limit(1)
        .maybeSingle();

      const convId = conv?.id || null;

      const msg = `🕐 Lembrete: amanhã (${apt.data}) às ${apt.hora_inicio} você tem agendado: ${apt.servico}. Confirma? Se precisar cancelar ou remarcar, é só avisar! [lembrete:${apt.id}]`;

      await sendMessage(instance.instance_name, `${apt.telefone}@s.whatsapp.net`, msg);

      if (convId) {
        await db.from("messages").insert({
          conversation_id: convId,
          remote_jid: `${apt.telefone}@s.whatsapp.net`,
          instance_id: apt.instance_id,
          from_me: true,
          content: msg,
          ai_processed: false,
        });

        await db
          .from("conversations")
          .update({
            last_message_preview: `Lembrete: ${apt.servico} amanhã ${apt.hora_inicio}`,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", convId);
      }

      console.log(`📅 Lembrete enviado para ${apt.cliente_nome} (${apt.telefone}): ${apt.servico} amanhã ${apt.hora_inicio}`);
    }
  } catch (err: any) {
    console.error("Erro no processador de lembretes:", err.message);
  }
}

let interval: ReturnType<typeof setInterval> | null = null;

export function startLembreteProcessor() {
  if (interval) return;
  console.log("Processador de lembretes iniciado (intervalo: 30min).");
  interval = setInterval(() => {
    processLembretes().catch((err) =>
      console.error("Erro no loop de lembretes:", err)
    );
  }, CHECK_INTERVAL);
}
