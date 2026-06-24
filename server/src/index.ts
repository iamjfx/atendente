import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { startQueueProcessor } from "./services/queue.js";
import { startPostVendaProcessor } from "./services/postVenda.js";
import { startLembreteProcessor } from "./services/lembrete.js";
import webhookRouter from "./routes/webhook.js";
import instancesRouter from "./routes/instances.js";
import messagesRouter from "./routes/messages.js";
import authRouter from "./routes/auth.js";
import dataRouter from "./routes/data.js";
import agendaRouter from "./routes/agenda.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/webhook", webhookRouter);
app.use("/instances", instancesRouter);
app.use("/messages", messagesRouter);
app.use("/auth", authRouter);
app.use("/db", dataRouter);
app.use("/agenda", agendaRouter);
app.use("/dashboard", dashboardRouter);

app.listen(config.port, () => {
  console.log(`Atendente API rodando na porta ${config.port}`);
  startQueueProcessor();
  startPostVendaProcessor();
  startLembreteProcessor();
});
