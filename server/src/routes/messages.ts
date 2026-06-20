import { Router, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { z } from "zod";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

// Apply authentication middleware
router.use(authMiddleware);

router.get("/conversations/:accountId", async (req: AuthenticatedRequest, res: Response) => {
  const { accountId } = req.params;

  if (req.user.id !== accountId) {
    return res.status(403).json({ error: "Forbidden: Access denied to this account" });
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("account_id", accountId)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(conversations || []);
});

router.get("/:conversationId", async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId } = req.params;

  // Verify conversation ownership
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("account_id")
    .eq("id", conversationId)
    .single();

  if (convErr || !conv) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  if (conv.account_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden: You do not own this conversation" });
  }
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json((messages || []).reverse());
});

router.post("/send", async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    conversationId: z.string().uuid(),
    text: z.string().min(1).max(4096),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { conversationId, text } = parsed.data;

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, instance_id, remote_jid, account_id")
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  if (conversation.account_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden: You do not own this conversation" });
  }

  const { data: instance, error: instError } = await supabase
    .from("evolution_instances")
    .select("id, instance_name")
    .eq("id", conversation.instance_id)
    .single();

  if (instError || !instance) {
    return res.status(404).json({ error: "Instance not found" });
  }

  const { data: newMessage, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      remote_jid: conversation.remote_jid,
      instance_id: instance.id,
      from_me: true,
      content: text,
    })
    .select()
    .single();

  if (msgError) {
    return res.status(500).json({ error: msgError.message });
  }

  await supabase
    .from("conversations")
    .update({
      last_message_preview: text.slice(0, 100),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  res.json({ message: newMessage, instanceName: instance.instance_name });
});

export default router;
