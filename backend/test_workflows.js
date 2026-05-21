import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("FAIL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log("SS Health Care workflow verifier\n");

  const { data: lead, error: leadErr } = await supabase
    .from("crm_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadErr || !lead) {
    console.error("FAIL: No CRM lead found to test with.", leadErr?.message || "");
    process.exit(1);
  }

  console.log("Lead selected:", lead.id);

  const phone =
    lead.phone ||
    lead.contact_phone ||
    lead.whatsapp_number ||
    "+919999999999";

  const templateName = "staff_assigned";
  const content =
    "Hello, your SS Health Care staff has been assigned. Please verify staff ID using the provided link.";

  const { data: rpcResult, error: rpcErr } = await supabase.rpc(
    "log_whatsapp_template_message",
    {
      p_lead_id: lead.id,
      p_phone: phone,
      p_template_name: templateName,
      p_content: content,
      p_payload: {
        source: "workflow_verifier",
        templateName,
      },
      p_sent_by: "workflow_verifier",
    }
  );

  if (rpcErr) {
    console.error("FAIL: log_whatsapp_template_message RPC failed.");
    console.error(rpcErr);
    process.exit(1);
  }

  console.log("PASS: WhatsApp template RPC executed.");
  console.log("RPC result:", rpcResult);

  const { data: logs, error: logsErr } = await supabase
    .from("template_message_logs")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("template_name", templateName)
    .order("created_at", { ascending: false })
    .limit(1);

  if (logsErr || !logs?.length) {
    console.error("FAIL: No template_message_logs row found.", logsErr?.message || "");
    process.exit(1);
  }

  console.log("PASS: template_message_logs row exists.");

  const { data: messages, error: msgErr } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("template_name", templateName)
    .order("created_at", { ascending: false })
    .limit(1);

  if (msgErr || !messages?.length) {
    console.error("FAIL: No whatsapp_messages row found.", msgErr?.message || "");
    process.exit(1);
  }

  console.log("PASS: whatsapp_messages row exists.");

  const { data: updatedLead, error: updatedErr } = await supabase
    .from("crm_leads")
    .select("id,last_template_sent,last_template_sent_at")
    .eq("id", lead.id)
    .single();

  if (updatedErr || updatedLead?.last_template_sent !== templateName) {
    console.error("FAIL: crm_leads last_template_sent was not updated.");
    console.error(updatedErr || updatedLead);
    process.exit(1);
  }

  console.log("PASS: crm_leads last_template_sent updated.");
  console.log("\nWorkflow verifier completed successfully.");
}

main().catch((err) => {
  console.error("FAIL: Unexpected error.");
  console.error(err);
  process.exit(1);
});
