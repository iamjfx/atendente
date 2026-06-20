import { Router, Request, Response } from "express";
import { handleIncomingMessage } from "../services/messageHandler.js";
import { config } from "../config.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const apikeyHeader = req.headers.apikey;

  if (apikeyHeader !== config.evolution.apiKey) {
    console.warn("Tentativa de chamada de webhook não autorizada.");
    return res.status(401).json({ error: "Unauthorized webhook key" });
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
