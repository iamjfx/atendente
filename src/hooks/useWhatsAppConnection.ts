import { useState, useCallback, useEffect } from "react";
import { db } from "@/integrations/db/client";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function createInstance(accountId: string) {
  const { data: { session } } = await db.auth.getSession();
  const res = await fetch(`${API_BASE}/instances/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify({ accountId }),
  });

  if (res.status === 409) {
    const { data } = await db
      .from("evolution_instances")
      .select("id, instance_name, connection_status, qr_code")
      .eq("account_id", accountId)
      .single();
    return data || null;
  }

  if (!res.ok) throw new Error(await res.text());

  return (await res.json()).instance;
}

async function fetchQrCode(instanceId: string) {
  const { data: { session } } = await db.auth.getSession();
  const res = await fetch(`${API_BASE}/instances/${instanceId}/connect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.qr_base64 || data.qr_code;
}

export function useWhatsAppConnection(profileId?: string) {
  const [instance, setInstance] = useState<any>(null);
  const [fetchingQr, setFetchingQr] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const startConnection = useCallback(async () => {
    if (!profileId) return;
    setFetchingQr(true);
    try {
      const inst = await createInstance(profileId);
      if (inst) {
        setInstance(inst);
        const qr = await fetchQrCode(inst.id);
        if (qr) setQrCode(qr);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao preparar conexão.");
    } finally {
      setFetchingQr(false);
    }
  }, [profileId]);

  const refreshQrCode = useCallback(async () => {
    if (!instance?.id) return;
    setFetchingQr(true);
    try {
      const qr = await fetchQrCode(instance.id);
      if (qr) setQrCode(qr);
    } catch (err) {
      console.error("Erro ao buscar QR code:", err);
      toast.error("Erro ao gerar o QR Code. Tente atualizar.");
    } finally {
      setFetchingQr(false);
    }
  }, [instance?.id]);

  useEffect(() => {
    if (!instance || instance.connection_status === "connected") return;

    const interval = setInterval(async () => {
      const { data } = await db
        .from("evolution_instances")
        .select("connection_status, qr_code")
        .eq("id", instance.id)
        .single();

      if (data) {
        setInstance((prev: any) =>
          prev ? { ...prev, connection_status: data.connection_status } : prev
        );
        if (data.connection_status === "connected") {
          setQrCode(null);
          toast.success("WhatsApp Conectado com sucesso!");
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [instance?.id, instance?.connection_status]);

  return {
    instance,
    fetchingQr,
    qrCode,
    setQrCode,
    setInstance,
    startConnection,
    refreshQrCode,
    setFetchingQr,
  };
}
