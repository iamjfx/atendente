import { Router, Response } from "express";
import { db } from "../lib/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/disponibilidade", async (req: AuthenticatedRequest, res: Response) => {
  const { account_id, data } = req.query;

  if (!account_id || !data) {
    return res.status(400).json({ error: "account_id e data são obrigatórios" });
  }

  const dataStr = data as string;
  const dateObj = new Date(dataStr + "T12:00:00");
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ error: "Data inválida" });
  }

  const diaSemana = dateObj.getDay();

  const { data: hours } = await db
    .from("business_hours")
    .select("*")
    .eq("user_id", account_id)
    .eq("dia_semana", diaSemana)
    .eq("ativo", true)
    .maybeSingle();

  if (!hours || !hours.abre || !hours.fecha) {
    return res.json({ disponivel: false, horarios: [], motivo: "Sem horários disponíveis neste dia" });
  }

  const { data: servicos } = await db
    .from("servicos_catalogo")
    .select("*")
    .eq("user_id", account_id)
    .eq("ativo", true);

  const { data: agendamentos } = await db
    .from("agendamentos")
    .select("hora_inicio, hora_fim, servico")
    .eq("user_id", account_id)
    .eq("data", dataStr)
    .not("status", "eq", "cancelled");

  const occupied: { inicio: string; fim: string }[] = (agendamentos || []).map((a: any) => ({
    inicio: a.hora_inicio,
    fim: a.hora_fim,
  }));

  const [abreH, abreM] = hours.abre.split(":").map(Number);
  const [fechaH, fechaM] = hours.fecha.split(":").map(Number);
  const abreMin = abreH * 60 + abreM;
  const fechaMin = fechaH * 60 + fechaM;

  const slots: string[] = [];
  const slotDuration = 60;
  for (let start = abreMin; start + slotDuration <= fechaMin; start += slotDuration) {
    const h = Math.floor(start / 60);
    const m = start % 60;
    const slotInicio = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const slotFimMin = start + slotDuration;
    const hFim = Math.floor(slotFimMin / 60);
    const mFim = slotFimMin % 60;
    const slotFim = `${String(hFim).padStart(2, "0")}:${String(mFim).padStart(2, "0")}`;

    const conflito = occupied.some((o) => {
      return slotInicio < o.fim && slotFim > o.inicio;
    });

    if (!conflito) {
      slots.push(slotInicio);
    }
  }

  res.json({
    disponivel: slots.length > 0,
    horarios: slots,
    servicos: servicos || [],
    data: dataStr,
    dia_semana: diaSemana,
  });
});

export default router;
