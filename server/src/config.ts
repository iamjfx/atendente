import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL || "http://srv1778424.hstgr.cloud:32774",
    apiKey: process.env.EVOLUTION_API_KEY || "AT30TE2863rXC0iWj7MoDxOKiPghZkKr",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  webhook: {
    baseUrl: process.env.WEBHOOK_BASE_URL || "http://localhost:3001",
  },
};
