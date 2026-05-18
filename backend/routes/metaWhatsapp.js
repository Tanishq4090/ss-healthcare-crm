/**
 * Meta WhatsApp Business API Routes
 * Integration-ready layer for WhatsApp Cloud API.
 * v1.0: wa.me prefilled links continue to work. Meta API is optional.
 */
import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

const META_API_VERSION = process.env.META_WA_API_VERSION || 'v23.0';

function getMetaConfig() {
  return {
    accessToken: process.env.META_WA_ACCESS_TOKEN || null,
    phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || null,
    businessAccountId: process.env.META_WA_BUSINESS_ACCOUNT_ID || null,
    verifyToken: process.env.META_WA_VERIFY_TOKEN || null,
    appSecret: process.env.META_WA_APP_SECRET || null,
    apiVersion: META_API_VERSION,
  };
}

function isMetaConfigured() {
  const cfg = getMetaConfig();
  return Boolean(cfg.accessToken && cfg.phoneNumberId);
}

/* ── GET /api/meta/health ─────────────────────────────────────────── */
router.get('/health', (_req, res) => {
  const cfg = getMetaConfig();
  res.json({
    ok: true,
    service: 'meta-whatsapp',
    integration_ready: true,
    connected: isMetaConfigured(),
    config: {
      access_token: Boolean(cfg.accessToken),
      phone_number_id: Boolean(cfg.phoneNumberId),
      business_account_id: Boolean(cfg.businessAccountId),
      verify_token: Boolean(cfg.verifyToken),
      app_secret: Boolean(cfg.appSecret),
      api_version: cfg.apiVersion,
    },
  });
});

/* ── GET /api/meta/webhook — Meta verification flow ───────────────── */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const cfg = getMetaConfig();
  if (!cfg.verifyToken) {
    return res.status(503).json({ error: 'Meta verify token not configured' });
  }

  if (mode === 'subscribe' && token === cfg.verifyToken) {
    console.log('[Meta WA] Webhook verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('[Meta WA] Webhook verification failed');
  return res.status(403).json({ error: 'Verification failed' });
});

/* ── POST /api/meta/webhook — Incoming events from Meta ───────────── */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Always acknowledge immediately
    res.status(200).json({ ok: true });

    // Process entries
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};

        // Delivery status events
        if (value.statuses) {
          for (const status of value.statuses) {
            await supabase.from('whatsapp_delivery_events').insert([{
              message_id: status.id,
              recipient_phone: status.recipient_id,
              status: status.status,
              timestamp: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString(),
              raw_payload: status,
            }]).catch((err) => console.warn('[Meta WA] Delivery event log error:', err.message));
          }
        }

        // Incoming messages — store only, do NOT auto-reply
        if (value.messages) {
          for (const msg of value.messages) {
            await supabase.from('whatsapp_messages').insert([{
              direction: 'inbound',
              phone: msg.from,
              message_type: msg.type,
              content: msg.text?.body || msg.caption || JSON.stringify(msg),
              meta_message_id: msg.id,
              timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
              raw_payload: msg,
            }]).catch((err) => console.warn('[Meta WA] Inbound message log error:', err.message));
          }
        }
      }
    }
  } catch (err) {
    console.error('[Meta WA] Webhook processing error:', err.message);
    // Already sent 200 — Meta requires fast ACK
  }
});

/* ── POST /api/meta/send-template ─────────────────────────────────── */
router.post('/send-template', async (req, res) => {
  const { leadId, phone, templateName, languageCode, variables } = req.body;

  if (!phone || !templateName) {
    return res.status(400).json({ ok: false, error: 'phone and templateName are required' });
  }

  // Normalize phone for Meta API (requires country code, no +)
  const digits = String(phone).replace(/\D/g, '');
  const intlPhone = digits.length === 10 ? `91${digits}` : digits;

  const cfg = getMetaConfig();

  // Log the template send attempt regardless of Meta connection
  const logEntry = {
    lead_id: leadId || null,
    phone: intlPhone,
    template_name: templateName,
    language_code: languageCode || 'en',
    variables: variables || {},
    sent_via: isMetaConfigured() ? 'meta_api' : 'wa_me_fallback',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (!isMetaConfigured()) {
    // Fallback: wa.me link (frontend handles opening)
    logEntry.status = 'fallback_wa_me';
    await supabase.from('template_message_logs').insert([logEntry]).catch(() => {});

    return res.json({
      ok: true,
      sent_via: 'wa_me_fallback',
      message: 'Meta WhatsApp not configured. Use wa.me link.',
      wa_me_url: `https://wa.me/${intlPhone}`,
    });
  }

  // Meta Cloud API send
  try {
    const apiUrl = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`;
    const metaPayload = {
      messaging_product: 'whatsapp',
      to: intlPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode || 'en' },
        ...(variables && Object.keys(variables).length > 0 ? {
          components: [{
            type: 'body',
            parameters: Object.values(variables).map((val) => ({ type: 'text', text: String(val) })),
          }],
        } : {}),
      },
    };

    const metaRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      logEntry.status = 'failed';
      logEntry.error = metaData?.error?.message || 'Unknown error';
      await supabase.from('template_message_logs').insert([logEntry]).catch(() => {});
      return res.status(metaRes.status).json({ ok: false, error: metaData?.error?.message || 'Meta API error', sent_via: 'meta_api' });
    }

    logEntry.status = 'sent';
    logEntry.meta_message_id = metaData?.messages?.[0]?.id || null;
    await supabase.from('template_message_logs').insert([logEntry]).catch(() => {});

    // Also log to whatsapp_messages
    await supabase.from('whatsapp_messages').insert([{
      direction: 'outbound',
      phone: intlPhone,
      message_type: 'template',
      content: `Template: ${templateName}`,
      meta_message_id: logEntry.meta_message_id,
      lead_id: leadId || null,
      timestamp: new Date().toISOString(),
    }]).catch(() => {});

    return res.json({
      ok: true,
      sent_via: 'meta_api',
      message_id: logEntry.meta_message_id,
    });
  } catch (err) {
    logEntry.status = 'error';
    logEntry.error = err.message;
    await supabase.from('template_message_logs').insert([logEntry]).catch(() => {});
    return res.status(500).json({ ok: false, error: err.message, sent_via: 'meta_api' });
  }
});

export default router;
