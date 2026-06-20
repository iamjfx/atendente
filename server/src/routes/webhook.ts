import { Router, Request, Response } from "express";
import { handleIncomingMessage } from "../services/messageHandler.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
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
