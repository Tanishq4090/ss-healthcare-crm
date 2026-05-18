/**
 * Callyzer Service (Phase 2 Integration)
 * Handles webhook ingestion, call sync, and health checks for Callyzer integration.
 */
import { supabase } from './supabase.js';

/**
 * Process incoming Callyzer webhook payload
 */
export async function processWebhook(payload) {
  if (!payload || !payload.calls || !Array.isArray(payload.calls)) {
    return { processed: 0, errors: ['Invalid payload format'] };
  }

  let processed = 0;
  const errors = [];

  for (const call of payload.calls) {
    try {
      const { error } = await supabase.from('call_inquiries').insert([{
        caller_name: call.contact_name || null,
        caller_phone: call.phone_number || null,
        call_date: call.call_time || new Date().toISOString(),
        duration_seconds: call.duration || 0,
        summary: call.notes || null,
        intent: call.type || 'inquiry',
        status: 'unprocessed',
      }]);
      if (error) errors.push(`Call ${call.phone_number}: ${error.message}`);
      else processed++;
    } catch (err) {
      errors.push(`Call ${call.phone_number}: ${err.message}`);
    }
  }

  return { processed, errors };
}

/**
 * Sync recent calls from Callyzer API (Phase 2)
 */
export async function syncRecentCalls(apiKey, dateFrom) {
  return { synced: 0, message: 'Callyzer API sync not yet connected. Phase 2.' };
}

/**
 * Health check for Callyzer integration
 */
export async function getHealth() {
  try {
    const { count, error } = await supabase
      .from('call_inquiries')
      .select('*', { count: 'exact', head: true });
    return {
      status: 'integration_ready',
      table_exists: !error,
      total_records: count || 0,
      callyzer_api_connected: false,
    };
  } catch {
    return { status: 'error', table_exists: false, total_records: 0, callyzer_api_connected: false };
  }
}
