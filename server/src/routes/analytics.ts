import { Router, Response } from "express";
import { db } from "../lib/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/geral", async (req: AuthenticatedRequest, res: Response) => {
  const accountId = req.user.id;
  const dias = parseInt(req.query.dias as string) || 30;
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();

  try {
    const [convResult, msgIa, msgTotal, agendResult, horasResult, regioesResult, evolResult] = await Promise.all([
      db.from("conversations").select("id, ai_resolved").eq("account_id", accountId).gte("created_at", desde),
      db.from("messages").select("id").in("conversation_id", []).eq("ai_processed", true).gte("created_at", desde),
      db.from("messages").select("id").in("conversation_id", []).gte("created_at", desde),
      db.from("agendamentos").select("id, servico, status").eq("user_id", accountId).gte("created_at", desde),
      db.raw(`SELECT EXTRACT(HOUR FROM created_at) as hora, COUNT(*) as total FROM messages WHERE account_id = $1 AND created_at >= $2 GROUP BY 1 ORDER BY 1`, [accountId, desde]),
      db.raw(`SELECT cidade, uf, COUNT(*) as total FROM clientes WHERE user_id = $1 GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20`, [accountId]),
      db.raw(`SELECT DATE(created_at) as data, COUNT(*) as total FROM conversations WHERE account_id = $1 AND created_at >= $2 GROUP BY 1 ORDER BY 1`, [accountId, desde]),
    ]);

    const conversas = convResult?.data || [];
    const totalConversas = conversas.length;
    const resolvidasIa = conversas.filter((c: any) => c.ai_resolved === true).length;

    // Mensagens — precisamos dos convIds reais
    const convs = await db.from("conversations").select("id").eq("account_id", accountId).gte("created_at", desde);
    const convIds = (convs?.data || []).map((c: any) => c.id);
    let totalIa = 0;
    let totalMsg = 0;
    if (convIds.length > 0) {
      const [iaRes, allRes] = await Promise.all([
        db.from("messages").select("id").in("conversation_id", convIds).eq("ai_processed", true).gte("created_at", desde),
        db.from("messages").select("id").in("conversation_id", convIds).gte("created_at", desde),
      ]);
      totalIa = (iaRes?.data || []).length;
      totalMsg = (allRes?.data || []).length;
    }

    // Tempo médio de resposta
    const tempoResp = await db.raw(`
      SELECT AVG(diff) as media
      FROM (
        SELECT MIN(EXTRACT(EPOCH FROM resp.created_at) - EXTRACT(EPOCH FROM msg.created_at)) as diff
        FROM messages msg
        JOIN messages resp ON resp.ai_response_id = msg.id
        WHERE msg.from_me = false AND resp.ai_processed = true AND msg.account_id = $1 AND msg.created_at >= $2
        GROUP BY msg.id
      ) sub
    `, [accountId, desde]);

    const agendamentos = agendResult?.data || [];
    const servicosCount: Record<string, number> = {};
    for (const a of agendamentos) {
      servicosCount[a.servico] = (servicosCount[a.servico] || 0) + 1;
    }
    const servicosRanking = Object.entries(servicosCount)
      .map(([k, v]) => ({ servico: k, total: v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    res.json({
      periodo_dias: dias,
      conversas: {
        total: totalConversas,
        resolvidas_ia: resolvidasIa,
        percentual_ia: totalConversas > 0 ? Math.round((resolvidasIa / totalConversas) * 100) : 0,
      },
      mensagens: {
        total: totalMsg,
        ia: totalIa,
        manual: totalMsg - totalIa,
        resolucao_ia: totalMsg > 0 ? Math.round((totalIa / totalMsg) * 100) : 0,
      },
      tempo_resposta_segundos: Math.round(tempoResp?.rows?.[0]?.media || 0),
      agendamentos: {
        total: agendamentos.length,
        servicos: servicosRanking,
      },
      horarios: horasResult?.rows || [],
      regioes: regioesResult?.rows || [],
      evolucao_diaria: evolResult?.rows || [],
    });
  } catch (err: any) {
    console.error("Erro no /analytics/geral:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
