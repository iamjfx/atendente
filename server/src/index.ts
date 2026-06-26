import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
import analyticsRouter from "./routes/analytics.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);

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
app.use("/analytics", analyticsRouter);

app.listen(config.port, () => {
  console.log(`Atendente API rodando na porta ${config.port}`);
  startQueueProcessor();
  startPostVendaProcessor();
  startLembreteProcessor();
});
