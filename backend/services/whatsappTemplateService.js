/**
 * WhatsApp Template Service
 * Backend service for generating and dispatching WhatsApp messages.
 */
import { supabase } from './supabase.js';

const TEMPLATES = {
  inquiry: (vars) =>
    `🌟 Welcome to SS Health Care! 🌟\n${vars.name} ji, aapki inquiry mili humein. Hamari team aapke ghar par best healthcare staff provide karne ke liye ready hai!\n\nKoi bhi sawaal ho toh seedha reply karein. Hum aapki service mein! 💙✨`,
  quotation_sent: (vars) =>
    `Namaste ${vars.name} ji! 🙏 Aapke liye humne ek customized quotation taiyar ki hai.\n\n📋 Service details check karein aur confirm karein.\n\nKoi bhi changes chahiye toh batayein — hum adjust kar sakte hain!`,
  staff_assigned: (vars) =>
    `Good news ${vars.name} ji! 🎉 ${vars.staffName} (${vars.staffRole}) ko assign kiya gaya hai!\n\nStaff ID verify karein: ${vars.idCardUrl}\n\nSS Health Care`,
  deposit_pending: (vars) =>
    `Namaste ${vars.name} ji! 🙏 Aapka deposit invoice ready hai.\n\n💰 Payment complete karne ke baad service start ho jayegi!`,
  monthly_billing: (vars) =>
    `Namaste ${vars.name} ji! 📄 Is mahine ka bill taiyar ho gaya hai.\n\nShukriya! 🙏`,
};

export function buildMessage(templateKey, variables) {
  const builder = TEMPLATES[templateKey];
  if (!builder) return `[Template "${templateKey}" not found]`;
  return builder(variables);
}

export async function logMessage({ leadId, phone, templateName, content, sentBy = 'system' }) {
  const { error } = await supabase.rpc('log_whatsapp_template_message', {
    p_lead_id: leadId || null,
    p_phone: phone,
    p_template_name: templateName,
    p_content: content,
    p_payload: {},
    p_sent_by: sentBy,
  });
  if (error) console.warn('WhatsApp log error:', error.message);
}

export { TEMPLATES };
