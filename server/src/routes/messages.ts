import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { z } from "zod";

const router = Router();

router.get("/conversations/:accountId", async (req: Request, res: Response) => {
  const { accountId } = req.params;

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

router.get("/:conversationId", async (req: Request, res: Response) => {
  const { conversationId } = req.params;
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

router.post("/send", async (req: Request, res: Response) => {
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
