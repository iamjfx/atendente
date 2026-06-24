import { Router, Response } from "express";
import { db } from "../lib/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/status", async (req: AuthenticatedRequest, res: Response) => {
  const accountId = req.user.id;
  const hoje = new Date().toISOString().split("T")[0];

  const hojeInicio = `${hoje}T00:00:00`;
  const hojeFim = `${hoje}T23:59:59`;

  const [convResult, aptResult, pendentesResult] = await Promise.all([
    db
      .from("conversations")
      .select("id")
      .eq("account_id", accountId)
      .gte("created_at", hojeInicio)
      .lte("created_at", hojeFim),

    db
      .from("agendamentos")
      .select("id, cliente_nome, servico, hora_inicio, status")
      .eq("user_id", accountId)
      .eq("data", hoje),

    db
      .from("conversations")
      .select("id, contact_name, last_message_preview, last_message_at")
      .eq("account_id", accountId)
      .eq("status", "active"),
  ]);

  const convData = convResult?.data || [];
  const aptData = aptResult?.data || [];
  const pendentesData = pendentesResult?.data || [];

  const { data: totalConv } = await db
    .from("conversations")
    .select("id")
    .eq("account_id", accountId);

  const { data: convs } = await db
    .from("conversations")
    .select("id")
    .eq("account_id", accountId);

  const convIds = (convs || []).map((c: any) => c.id);
  let totalIaMessages = 0;
  let totalMessages = 0;

  if (convIds.length > 0) {
    const iaResult = await db
      .from("messages")
      .select("id")
      .in("conversation_id", convIds)
      .eq("ai_processed", true)
      .gte("created_at", hojeInicio)
      .lte("created_at", hojeFim);
    totalIaMessages = (iaResult?.data || []).length;

    const allResult = await db
      .from("messages")
      .select("id")
      .in("conversation_id", convIds)
      .gte("created_at", hojeInicio)
      .lte("created_at", hojeFim);
    totalMessages = (allResult?.data || []).length;
  }

  const conversasHoje = convData.length;
  const agendamentosHoje = aptData;
  const pendentes = pendentesData
    .filter((c: any) => {
      if (!c.last_message_at) return true;
      const horas = (Date.now() - new Date(c.last_message_at).getTime()) / (1000 * 60 * 60);
      return horas > 2;
    })
    .slice(0, 5);

  const totalConversas = totalConv?.length || 0;

  res.json({
    conversas_hoje: conversasHoje,
    total_conversas: totalConversas,
    messages_hoje: totalMessages,
    ia_messages_hoje: totalIaMessages,
    agendamentos_hoje: agendamentosHoje,
    pendentes,
    resolucao_ia: totalMessages > 0 ? Math.round((totalIaMessages / totalMessages) * 100) : 0,
  });
});

export default router;
