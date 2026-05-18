import express from "express";
import { supabase } from "../services/supabase.js";

const router = express.Router();

async function countTable(table) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  return { table, ok: !error, count: count || 0, error: error?.message || null };
}

router.get("/health", async (_req, res) => {
  const checks = await Promise.all([
    countTable("crm_leads"),
    countTable("call_inquiries"),
    countTable("employees"),
    countTable("manual_attendance"),
  ]);

  const coreHealthy = checks.every((check) => check.ok);

  res.json({
    ok: coreHealthy,
    service: "ss-healthcare-live-product",
    version: "v1.0-live",
    ts: new Date().toISOString(),
    env: {
      supabase_url: Boolean(process.env.SUPABASE_URL),
      supabase_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY),
      callyzer_webhook_secret: Boolean(process.env.CALLYZER_WEBHOOK_SECRET),
      callyzer_api_token: Boolean(process.env.CALLYZER_API_TOKEN),
      meta_wa_configured: Boolean(process.env.META_WA_ACCESS_TOKEN),
    },
    integrations: {
      callyzer: {
        integration_ready: true,
        connected: Boolean(process.env.CALLYZER_WEBHOOK_SECRET || process.env.CALLYZER_API_TOKEN),
        required_for_v1: false,
      },
      meta_whatsapp: {
        integration_ready: true,
        connected: Boolean(process.env.META_WA_ACCESS_TOKEN && process.env.META_WA_PHONE_NUMBER_ID),
        required_for_v1: false,
      },
    },
    checks,
  });
});

export default router;
