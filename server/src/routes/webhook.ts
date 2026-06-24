import { Router, Request, Response } from "express";
import { handleIncomingMessage } from "../services/messageHandler.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

async function handleConnectionUpdate(instanceName: string, state: string) {
  if (state === "open") {
    console.log(`WhatsApp conectado: ${instanceName}`);
    await supabase
      .from("evolution_instances")
      .update({ connection_status: "connected", qr_code: null })
      .eq("instance_name", instanceName);
  } else if (state === "close" || state === "disconnected") {
    console.log(`WhatsApp desconectado: ${instanceName}`);
    await supabase
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

  try {
    const result = await handleIncomingMessage(req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Erro no webhook:", message);
    res.status(400).json({ error: message });
  }
});

export default router;
