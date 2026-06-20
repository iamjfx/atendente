import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, Loader2, Smartphone, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface Instance {
  id: string;
  instance_name: string;
  connection_status: string;
  qr_code: string | null;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { profile } = useAccount();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingQr, setFetchingQr] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadInstance();
  }, [profile?.id]);

  async function loadInstance() {
    setLoading(true);
    const { data } = await supabase
      .from("evolution_instances")
      .select("id, instance_name, connection_status, qr_code")
      .eq("account_id", profile!.id)
      .single();
    if (data) {
      setInstance(data);
      if (data.connection_status === "connecting") {
        fetchQrCode(data.id);
      }
    }
    setLoading(false);
  }

  async function createInstance(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_BASE}/instances/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({ accountId: profile!.id }),
    });

    if (res.status === 409) {
      const { data } = await supabase
        .from("evolution_instances")
        .select("id, instance_name, connection_status, qr_code")
        .eq("account_id", profile!.id)
        .single();
      if (data) {
        setInstance(data);
        return data.id;
      }
      return null;
    }

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    setInstance(data.instance);
    return data.instance.id;
  }

  const fetchQrCode = useCallback(async (instanceId: string) => {
    setFetchingQr(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/instances/${instanceId}/connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const qrBase64 = data.qr_base64 || data.qr_code;
      if (qrBase64) setQrCode(qrBase64);
    } catch (err) {
      console.error("Erro ao buscar QR code:", err);
    } finally {
      setFetchingQr(false);
    }
  }, []);

  async function handleConnect() {
    if (!profile?.id) return;
    let instanceId = instance?.id || null;

    if (!instanceId) {
      instanceId = await createInstance();
    }

    if (!instanceId) return;
    await fetchQrCode(instanceId);
  }

  async function handleDisconnect() {
    if (!instance) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/instances/${instance.id}/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      setInstance({ ...instance, connection_status: "disconnected", qr_code: null });
      setQrCode(null);
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    }
  }

  useEffect(() => {
    if (!instance || instance.connection_status !== "connecting") return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("evolution_instances")
        .select("connection_status, qr_code")
        .eq("id", instance.id)
        .single();
      if (data) {
        setInstance((prev) => prev ? { ...prev, connection_status: data.connection_status } : prev);
        if (data.connection_status === "connected") {
          setQrCode(null);
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [instance?.id, instance?.connection_status]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie as conexões e dados do Atendente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando conexão...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {instance?.connection_status === "connected" ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {instance?.connection_status === "connected"
                      ? "Conectado"
                      : instance?.connection_status === "connecting"
                      ? "Conectando..."
                      : "Desconectado"}
                  </p>
                  {instance && (
                    <p className="text-xs text-muted-foreground">{instance.instance_name}</p>
                  )}
                </div>
              </div>

              {instance?.connection_status === "connecting" && (
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
                  {fetchingQr ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gerando QR code...
                    </div>
                  ) : qrCode ? (
                    <>
                      <img
                        src={`data:image/png;base64,${qrCode}`}
                        alt="QR Code WhatsApp"
                        className="w-48 h-48"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Escaneie o QR code com o WhatsApp do seu número comercial
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQrCode(null)}
                        className="rounded-full"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Fechar
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-12">QR code indisponível</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!instance || instance.connection_status === "disconnected" ? (
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={handleConnect}
                    disabled={fetchingQr}
                  >
                    {fetchingQr ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5 mr-1" />
                    )}
                    {instance ? "Reconectar" : "Conectar WhatsApp"}
                  </Button>
                ) : instance.connection_status === "connected" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleDisconnect}
                  >
                    <WifiOff className="w-3.5 h-3.5 mr-1" />
                    Desconectar
                  </Button>
                ) : instance.connection_status === "connecting" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => fetchQrCode(instance.id)}
                    disabled={fetchingQr}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-1", fetchingQr && "animate-spin")} />
                    Atualizar QR Code
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={user?.email ?? ""} disabled className="opacity-60" />
          </div>
          <p className="text-xs text-muted-foreground">
            O email é usado para login. Para alterar, acesse as configurações da sua conta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
