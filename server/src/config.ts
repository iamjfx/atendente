import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  publicApiKey: process.env.PUBLIC_API_KEY || "chave_publica_vitrine_dev",
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL || "http://srv1778424.hstgr.cloud:32774",
    apiKey: (() => {
      if (!process.env.EVOLUTION_API_KEY) {
        console.error('ERRO CRÍTICO: EVOLUTION_API_KEY não definida.');
        process.exit(1);
      }
      return process.env.EVOLUTION_API_KEY;
    })(),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  webhook: {
    baseUrl: process.env.WEBHOOK_BASE_URL || "http://localhost:3001",
  },
};
