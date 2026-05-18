/**
 * WhatsApp Templates Domain Logic
 * Builds WhatsApp message templates for different pipeline stages.
 */

const TEMPLATES: Record<string, (vars: Record<string, string>) => string> = {
  inquiry: (v) =>
    `🌟 Welcome to SS Health Care! 🌟\n${v.name} ji, aapki inquiry mili humein. Hamari team aapke ghar par best healthcare staff provide karne ke liye ready hai!\n\nKoi bhi sawaal ho toh seedha reply karein. Hum aapki service mein! 💙✨`,
  quotation_sent: (v) =>
    `Namaste ${v.name} ji! 🙏 Aapke liye humne ek customized quotation taiyar ki hai.\n\n📋 Service details check karein aur confirm karein.\n\nKoi bhi changes chahiye toh batayein — hum adjust kar sakte hain!`,
  consent_form: (v) =>
    `Hi ${v.name} ji! Ek aakhri step baki hai — apna consent form fill karein aur hum service start kar denge! ✅\n\nSirf 2 minute lagenge!`,
  staff_assigned: (v) =>
    `Good news ${v.name} ji! 🎉 Aapke liye ${v.staffName} (${v.staffRole}) ko assign kiya gaya hai!\n\n👤 Unka profile verify karein:\n${v.idCardUrl}\n\nKoi concern ho toh hume batayein!\n\nSS Health Care`,
  deposit_pending: (v) =>
    `Namaste ${v.name} ji! 🙏 Aapka deposit invoice ready hai.\n\n💰 Payment complete karne ke baad service start ho jayegi!`,
  monthly_billing: (v) =>
    `Namaste ${v.name} ji! 📄 Is mahine ka bill taiyar ho gaya hai.\n\nPayment complete karne par confirmation milegi. Shukriya! 🙏`,
};

export function buildTemplateMessage(
  templateKey: string,
  variables: Record<string, string>,
): string {
  const builder = TEMPLATES[templateKey];
  if (!builder) return `[Template "${templateKey}" not found]`;
  return builder(variables);
}

export function getAvailableTemplateKeys(): string[] {
  return Object.keys(TEMPLATES);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
