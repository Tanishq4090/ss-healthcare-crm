/**
 * server.js – SS HealthCare CRM Backend
 * Production-ready Express API for Callyzer manual call review + live admin OS.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { supabase } from "./services/supabase.js";

dotenv.config();

import whatsappRoutes, { setWss } from "./routes/whatsapp.js";
import attendanceRoutes from "./routes/attendance.js";
import crmRoutes from "./routes/crm.js";
import callyzerRoutes from "./routes/callyzer.js";
import systemRoutes from "./routes/system.js";
import authRoutes from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

let crmChannel = null;
try {
  crmChannel = supabase.channel("crm_updates");
  crmChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") console.log("[Realtime] Connected to Supabase crm_updates channel.");
  });
} catch (err) {
  console.warn("[Realtime] Supabase realtime disabled:", err.message);
}

export function broadcast(event, data) {
  if (!crmChannel) return;
  crmChannel.send({ type: "broadcast", event: "crm_event", payload: { event, data, ts: Date.now() } }).catch((err) => console.error("[Realtime Broadcast Error]", err));
}

setWss(broadcast);

app.set("trust proxy", 1);

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  next();
});

app.use(helmet({ contentSecurityPolicy: false, hsts: { maxAge: 31536000, includeSubDomains: true, preload: true } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
}));

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["*"] }));
app.use("/api/whatsapp/webhook", express.urlencoded({ extended: false }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/attendance", requireAuth, attendanceRoutes);
app.use("/api/crm-config", requireAuth, crmRoutes);
app.use("/api/callyzer", callyzerRoutes);
app.use("/api/system", systemRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ss-healthcare-backend", ts: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, _next) => {
  console.error({ message: "[Global Error] Internal API Error", error: err.message, stack: process.env.NODE_ENV === "production" ? null : err.stack, path: req.path, method: req.method, ip: req.ip });
  res.status(500).json({ error: "Internal server error" });
});

httpServer.listen(PORT, () => {
  console.log(`\n✅  SS Healthcare backend → http://localhost:${PORT}`);
  console.log("   API ready: /health, /api/system/health, /api/callyzer/health");
});

export default app;
