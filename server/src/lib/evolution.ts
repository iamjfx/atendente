import { config } from "../config.js";

const headers = () => ({
  "Content-Type": "application/json",
  apikey: config.evolution.apiKey,
});

interface EvolutionInstance {
  instance: { instanceName: string };
  qrcode: { pairingCode: string; base64: string } | null;
  hash: { apikey: string };
  settings: Record<string, unknown>;
}

export async function createInstance(
  instanceName: string
): Promise<EvolutionInstance> {
  const res = await fetch(
    `${config.evolution.apiUrl}/instance/create`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        instanceName,
        integration: "WHATSAPP-BAILEYS",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution createInstance failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getInstance(instanceName: string) {
  const res = await fetch(
    `${config.evolution.apiUrl}/instance/fetchInstances`,
    { headers: headers() }
  );

  if (!res.ok) return null;

  const instances: EvolutionInstance[] = await res.json();
  return instances.find((i) => i.instance.instanceName === instanceName) || null;
}

export async function connectInstance(instanceName: string) {
  const res = await fetch(
    `${config.evolution.apiUrl}/instance/connect/${instanceName}`,
    { method: "GET", headers: headers() }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution connectInstance failed: ${res.status} ${text}`);
  }

  const data = await res.json() as { pairingCode?: string; code?: string; base64?: string; count?: number };

  return {
    pairingCode: data.pairingCode || "",
    code: data.code || "",
    base64: data.base64 || "",
    count: data.count || 0,
  };
}

export async function disconnectInstance(instanceName: string) {
  const res = await fetch(
    `${config.evolution.apiUrl}/instance/logout/${instanceName}`,
    { method: "DELETE", headers: headers() }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution disconnectInstance failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getConnectionState(instanceName: string) {
  const res = await fetch(
    `${config.evolution.apiUrl}/instance/connectionState/${instanceName}`,
    { headers: headers() }
  );

  if (!res.ok) return { state: "disconnected" };

  return res.json() as Promise<{ state: string }>;
}

export async function sendMessage(
  instanceName: string,
  remoteJid: string,
  text: string
) {
  const res = await fetch(
    `${config.evolution.apiUrl}/message/sendText/${instanceName}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        number: remoteJid.replace(/[^0-9]/g, ""),
        text,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution sendMessage failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function downloadMedia(
  instanceName: string,
  message: Record<string, unknown>
): Promise<{ data: string; mimeType: string } | null> {
  const res = await fetch(
    `${config.evolution.apiUrl}/chat/downloadMedia/${instanceName}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ message }),
    }
  );

  if (res.status === 404) {
    console.log(`Media download endpoint nao disponivel (Evolution API v2.1.0) — pulando`);
    return null;
  }

  if (!res.ok) {
    console.log(`Evolution downloadMedia falhou: ${res.status}`);
    return null;
  }

  return res.json();
}

export async function setWebhook(
  instanceName: string,
  webhookUrl: string
) {
  const res = await fetch(
    `${config.evolution.apiUrl}/instance/setWebhook/${instanceName}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        url: webhookUrl,
        enabled: true,
        webhookByEvents: true,
        events: ["MESSAGES_UPSERT"],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution setWebhook failed: ${res.status} ${text}`);
  }

  return res.json();
}
