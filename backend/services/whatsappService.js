import fetch from "node-fetch";

/**
 * WhatsApp Meta Integration Service.
 * Phase 1 uses manual CRM-triggered outbound messages only.
 */

const { META_ACCESS_TOKEN, META_PHONE_NUMBER_ID } = process.env;
const META_API_URL = `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`;

export const sendWhatsAppMessage = async (to, body, isDevMode = false) => {
  if (isDevMode) {
    console.log(`[DEV] WhatsApp -> ${to}: ${body}`);
    return { mock: true };
  }

  const cleanNumber = to.replace(/^\+/, "");
  const res = await fetch(META_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${META_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanNumber,
      type: "text",
      text: { body },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Meta API error");
  return data;
};

export const sendBookingConfirmation = async (payload, isDevMode) => {
  const { phone, name, service, date, time, location } = payload;
  const serviceName = (service || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const message =
    `Appointment Confirmed\n\n` +
    `Hi ${name}, your SS Health Care appointment is booked.\n\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n` +
    `Service: ${serviceName}\n` +
    `Location: ${location}\n\n` +
    `Our team will call you to confirm the next step.\n\n` +
    `SS Health Care`;

  await sendWhatsAppMessage(phone, message, isDevMode);
  return message;
};

export const sendOTPMessage = async (phone, code, isDevMode) => {
  if (isDevMode) {
    console.log(`\n[DEV MODE] OTP for ${phone} -> ${code}\n`);
    return code;
  }

  await sendWhatsAppMessage(phone, `Your SS Health Care verification code: *${code}*\n\nExpires in 10 minutes.`, isDevMode);
  return code;
};
