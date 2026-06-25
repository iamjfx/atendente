import { db } from "../../lib/db.js";

export async function checkRecurringClient(
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
