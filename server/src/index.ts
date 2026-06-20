import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { startQueueProcessor } from "./services/queue.js";
import webhookRouter from "./routes/webhook.js";
import instancesRouter from "./routes/instances.js";
import messagesRouter from "./routes/messages.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/webhook", webhookRouter);
app.use("/instances", instancesRouter);
app.use("/messages", messagesRouter);

app.listen(config.port, () => {
  console.log(`Atendente API rodando na porta ${config.port}`);
  startQueueProcessor();
});
