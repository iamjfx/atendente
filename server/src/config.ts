import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
    apiKey: process.env.EVOLUTION_API_KEY || "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  webhook: {
    baseUrl: process.env.WEBHOOK_BASE_URL || "http://localhost:3001",
  },
};
