import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export type CalendarProvider = "google_calendar" | "icloud_calendar" | "outlook_calendar";

export interface CalendarIntegration {
  provider: CalendarProvider;
  account_email: string;
  conectado_em: string;
  ativo: boolean;
  external_calendar_id?: string;
  sincronizacao_bidirecional: boolean;
}

export interface CalendarPreferences {
  sincronizar_automaticamente: boolean;
  cor_compromisso: string;
  nome_calendario: string;
  tempo_bloqueio: number; // buffer in minutes
}

const DEFAULT_PREFS: CalendarPreferences = {
  sincronizar_automaticamente: true,
  cor_compromisso: "#1a5fb4",
  nome_calendario: "Atendente",
  tempo_bloqueio: 15,
};

const STORAGE_KEYS = {
  INTEGRATIONS: "at_calendar_integrations",
  PREFS: "at_calendar_preferences",
};

export const useCalendarIntegration = () => {
  const [integrations, setIntegrations] = useState<Record<CalendarProvider, CalendarIntegration | null>>({
    google_calendar: null,
    icloud_calendar: null,
    outlook_calendar: null,
  });
  const [preferences, setPreferences] = useState<CalendarPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = () => {
      try {
        const savedInts = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
        const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFS);

        if (savedInts) {
          setIntegrations(JSON.parse(savedInts));
        }
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }
      } catch (e) {
        console.error("Erro ao carregar configurações de calendário:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const savePreferences = useCallback(async (patch: Partial<CalendarPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(next));
      return next;
    });
  }, []);

  const connect = useCallback(async (provider: CalendarProvider, email: string, additionalData?: { password?: string; calendarId?: string }) => {
    setLoading(true);
    // Simula atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newIntegration: CalendarIntegration = {
      provider,
      account_email: email,
      conectado_em: new Date().toISOString(),
      ativo: true,
      external_calendar_id: additionalData?.calendarId || "primary",
      sincronizacao_bidirecional: false,
    };

    setIntegrations((prev) => {
      const next = { ...prev, [provider]: newIntegration };
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(next));
      return next;
    });
    setLoading(false);

    toast.success("Integração conectada!", {
      description: `Sua agenda foi integrada com sucesso ao ${
        provider === "google_calendar"
          ? "Google Calendar"
          : provider === "icloud_calendar"
          ? "iCloud Calendar"
          : "Outlook/Microsoft 365"
      }.`,
    });
  }, []);

  const disconnect = useCallback(async (provider: CalendarProvider) => {
    setLoading(true);
    // Simula atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIntegrations((prev) => {
      const next = { ...prev, [provider]: null };
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(next));
      return next;
    });
    setLoading(false);

    toast.info("Integração removida", {
      description: "A sincronização automática foi desativada.",
    });
  }, []);

  return {
    integrations,
    preferences,
    loading,
    savePreferences,
    connect,
    disconnect,
    isConnected: (provider: CalendarProvider) => !!integrations[provider]?.ativo,
  };
};
