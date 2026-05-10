import express from "express";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "chat",
    mode: "safe-local-fallback",
    ts: new Date().toISOString(),
  });
});

router.post("/", async (req, res) => {
  const message = String(req.body?.message || req.body?.prompt || "").trim();
  const context = req.body?.context || {};

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const lower = message.toLowerCase();
  let answer = "I can help with CRM follow-ups, call review, HR attendance, and healthcare service inquiry summaries.";

  if (lower.includes("call") || lower.includes("callyzer")) {
    answer = "Use the Call Review Inbox for Callyzer calls. Review caller number, service, transcript, recording, and extracted details before adding the inquiry to the CRM pipeline.";
  } else if (lower.includes("attendance") || lower.includes("hr")) {
    answer = "Use AI HR for workforce records and Manual Attendance for present, absent, half-day, leave, check-in, and check-out tracking.";
  } else if (lower.includes("pipeline") || lower.includes("lead")) {
    answer = "Qualified inquiries should enter the New Lead stage only after staff review. This prevents spam, missed calls, and duplicate callers from polluting the pipeline.";
  } else if (lower.includes("quotation") || lower.includes("message")) {
    answer = "After a call is converted to a pipeline lead, staff can send template-based follow-up messages from the CRM pipeline workflow.";
  }

  res.json({
    ok: true,
    answer,
    source: "backend/routes/chat.js fallback responder",
    received: { message, context },
  });
});

router.post("/hr", async (req, res) => {
  res.json({
    ok: true,
    summary: "AI HR fallback is online. Connect a model provider later for deeper workforce analysis.",
    recommendations: [
      "Review staff with repeated absences.",
      "Check unassigned high-priority inquiries.",
      "Keep manual attendance verified before payroll processing.",
    ],
  });
});

export default router;
