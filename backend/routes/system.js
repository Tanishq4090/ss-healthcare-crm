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

  res.json({
    ok: checks.every((check) => check.ok),
    service: "ss-healthcare-live-product",
    ts: new Date().toISOString(),
    env: {
      supabase_url: Boolean(process.env.SUPABASE_URL),
      supabase_key: Boolean(process.env.SUPABASE_KEY),
      callyzer_webhook_secret: Boolean(process.env.CALLYZER_WEBHOOK_SECRET),
      callyzer_api_token: Boolean(process.env.CALLYZER_API_TOKEN),
    },
    checks,
  });
});

export default router;
