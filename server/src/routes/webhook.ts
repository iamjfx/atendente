import { Router, Request, Response } from "express";
import { handleIncomingMessage } from "../services/messageHandler.js";
import { db } from "../lib/db.js";

const router = Router();

async function handleConnectionUpdate(instanceName: string, state: string) {
  if (state === "open") {
    console.log(`WhatsApp conectado: ${instanceName}`);
    await db
      .from("evolution_instances")
      .update({ connection_status: "connected", qr_code: null })
      .eq("instance_name", instanceName);
  } else if (state === "close" || state === "disconnected") {
    console.log(`WhatsApp desconectado: ${instanceName}`);
    await db
      .from("evolution_instances")
      .update({ connection_status: "disconnected" })
      .eq("instance_name", instanceName);
  }
}

router.post("/", async (req: Request, res: Response) => {
  const { event, instance, data } = req.body;

  if (event === "connection.update" && instance && data?.state) {
    await handleConnectionUpdate(instance, data.state);
    return res.json({ handled: true, event: "connection.update" });
  }

  let normalizedBody = req.body;
  if (Array.isArray(data) && data.length > 0) {
    normalizedBody = { ...req.body, data: data[0] };
  }

  try {
    const result = await handleIncomingMessage(normalizedBody);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Erro no webhook:", message);
    if (err instanceof Error && err.message.includes("key")) {
      console.log("Payload recebido (primeiros 500 chars):", JSON.stringify(req.body).slice(0, 500));
    }
    res.status(400).json({ error: message });
  }
});

export default router;
