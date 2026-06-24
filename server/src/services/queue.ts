import { db } from "../lib/db.js";
import { sendMessage } from "../lib/evolution.js";

let isProcessing = false;

export async function processQueue() {
  if (isProcessing) {
    return;
  }
  isProcessing = true;

  try {
    const { data: pending, error } = await db
      .from("message_queue")
      .select("*, evolution_instances!inner(instance_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Erro ao buscar fila de mensagens:", error.message);
      return;
    }

    if (!pending || pending.length === 0) return;

    console.log(`Processando ${pending.length} mensagens na fila...`);

    for (const item of pending) {
      try {
        await db
          .from("message_queue")
          .update({ status: "sending" })
          .eq("id", item.id);

        const instanceName = (item as unknown as { evolution_instances: { instance_name: string } }).evolution_instances.instance_name;

        await sendMessage(instanceName, item.remote_jid, item.content);

        await db
          .from("message_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", item.id);

        console.log(`Fila: mensagem ${item.id} enviada para ${item.remote_jid}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Fila: erro ao enviar mensagem ${item.id}:`, message);

        await db
          .from("message_queue")
          .update({ status: "failed", error: message })
          .eq("id", item.id);
      }
    }
  } finally {
    isProcessing = false;
  }
}

let queueInterval: ReturnType<typeof setInterval> | null = null;

export function startQueueProcessor(intervalMs = 3000) {
  if (queueInterval) return;
  console.log(`Processador de fila iniciado (intervalo: ${intervalMs}ms)`);
  queueInterval = setInterval(() => {
    processQueue().catch((err) =>
      console.error("Erro no processador de fila:", err)
    );
  }, intervalMs);
}

export function stopQueueProcessor() {
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
    console.log("Processador de fila parado");
  }
}
