import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import {
  createInstance,
  getInstance,
  connectInstance,
  disconnectInstance,
  getConnectionState,
  setWebhook,
} from "../lib/evolution.js";

const router = Router();

router.get("/:accountId", async (req: Request, res: Response) => {
  const { accountId } = req.params;

  const { data: instances, error } = await supabase
    .from("evolution_instances")
    .select("*")
    .eq("account_id", accountId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const enriched = await Promise.all(
    (instances || []).map(async (inst) => {
      try {
        const state = await getConnectionState(inst.instance_name);
        return { ...inst, connection_state: state.state };
      } catch {
        return { ...inst, connection_state: "unknown" };
      }
    })
  );

  res.json(enriched);
});

router.post("/create", async (req: Request, res: Response) => {
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "accountId is required" });
  }

  const instanceName = `atd_${accountId.replace(/-/g, "").slice(0, 12)}`;

  const { data: existing } = await supabase
    .from("evolution_instances")
    .select("id")
    .eq("account_id", accountId)
    .single();

  if (existing) {
    return res.status(409).json({ error: "Instance already exists", instanceId: existing.id });
  }

  try {
    const evoResult = await createInstance(instanceName);

    const { data: instance, error } = await supabase
      .from("evolution_instances")
      .insert({
        account_id: accountId,
        instance_name: instanceName,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save instance: ${error.message}`);
    }

    const qrBase64 = evoResult.qrcode?.base64
      ? evoResult.qrcode.base64.replace(/^data:image\/png;base64,/, "")
      : null;

    res.json({ instance, qrcode: evoResult.qrcode, qr_base64: qrBase64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.post("/:instanceId/connect", async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  const { data: instance, error } = await supabase
    .from("evolution_instances")
    .select("*")
    .eq("id", instanceId)
    .single();

  if (error || !instance) {
    return res.status(404).json({ error: "Instance not found" });
  }

  try {
    await supabase
      .from("evolution_instances")
      .update({ connection_status: "connecting" })
      .eq("id", instanceId);

    const qrData = await connectInstance(instance.instance_name);

    const qrBase64 = qrData.base64
      ? qrData.base64.replace(/^data:image\/png;base64,/, "")
      : "";

    if (qrData.code) {
      await supabase
        .from("evolution_instances")
        .update({
          qr_code: qrData.code,
          connection_status: "connecting",
        })
        .eq("id", instanceId);
    }

    res.json({
      qr_code: qrBase64,
      qr_base64: qrBase64,
      pairingCode: qrData.pairingCode,
      instanceName: instance.instance_name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("evolution_instances")
      .update({ connection_status: "disconnected" })
      .eq("id", instanceId);
    res.status(500).json({ error: message });
  }
});

router.post("/:instanceId/disconnect", async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  const { data: instance, error } = await supabase
    .from("evolution_instances")
    .select("*")
    .eq("id", instanceId)
    .single();

  if (error || !instance) {
    return res.status(404).json({ error: "Instance not found" });
  }

  try {
    await disconnectInstance(instance.instance_name);

    await supabase
      .from("evolution_instances")
      .update({
        connection_status: "disconnected",
        qr_code: null,
      })
      .eq("id", instanceId);

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.post("/:instanceId/webhook", async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  const { data: instance, error } = await supabase
    .from("evolution_instances")
    .select("*")
    .eq("id", instanceId)
    .single();

  if (error || !instance) {
    return res.status(404).json({ error: "Instance not found" });
  }

  try {
    const webhookUrl = `${req.protocol}://${req.get("host")}/webhook`;
    await setWebhook(instance.instance_name, webhookUrl);

    res.json({ success: true, webhookUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
