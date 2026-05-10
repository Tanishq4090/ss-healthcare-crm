import { processMessage } from "./aiHandler.js";
import { getConversation, addMessage } from "./conversationStore.js";
import fetch from "node-fetch";

/**
 * WhatsApp Meta Integration & Orchestration Service
 */

const { META_ACCESS_TOKEN, META_PHONE_NUMBER_ID } = process.env;
const META_API_URL = `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`;
const MAX_AI_REPLIES = 10;

export const sendWhatsAppMessage = async (to, body, isDevMode = false) => {
  if (isDevMode) {
    console.log(`[DEV] WhatsApp → ${to}: ${body}`);
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
  const serviceName = (service || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  
  const message =
    `✅ *Appointment Confirmed!*\n\n` +
    `Hi ${name}, your SS Health Care appointment is booked! Here are your details:\n\n` +
    `📅 *Date:* ${date}\n` +
    `⏰ *Time:* ${time}\n` +
    `🏥 *Service:* ${serviceName}\n` +
    `📍 *Location:* ${location}\n\n` +
    `Our team will call you within 2 hours to confirm.\n\n` +
    `For help: *+91 9016 116 564*\n` +
    `_SS Health Care — Helping Hands_ 💙`;

  await sendWhatsAppMessage(phone, message, isDevMode);
  return message;
};

export const sendOTPMessage = async (phone, code, isDevMode) => {
  if (isDevMode) {
    console.log(`\n[DEV MODE] OTP for ${phone} → ${code}\n`);
    return code;
  }
  await sendWhatsAppMessage(phone, `Your HealthFirst verification code: *${code}*\n\nExpires in 10 minutes.`, isDevMode);
  return code;
};

export const handleInboundMessage = async (phone, messageText, isDevMode, broadcast) => {
  try {
    broadcast("ai_typing", { phone, typing: true });

    const conv = getConversation(phone);
    if (conv && conv.aiResponseCount >= MAX_AI_REPLIES) {
      const handoffMsg = "I've reached my automated chat limit for today. A human agent will get back to you shortly to assist further. Thank you! 🙏";
      const msg = addMessage(phone, "assistant", handoffMsg);
      broadcast("ai_typing", { phone, typing: false });
      broadcast("new_message", { phone, message: msg });
      broadcast("conversation_updated", getConversation(phone));
      
      await sendWhatsAppMessage(phone, handoffMsg, isDevMode);
      
      conv.aiEnabled = false;
      broadcast("conversation_updated", getConversation(phone));
      return;
    }

    const { reply } = await processMessage(phone, messageText, conv?.aiResponseCount || 0);
    const msg = addMessage(phone, "assistant", reply);

    broadcast("ai_typing", { phone, typing: false });
    broadcast("new_message", { phone, message: msg });
    broadcast("conversation_updated", getConversation(phone));

    await sendWhatsAppMessage(phone, reply, isDevMode);
    console.log(`[Bot] Replied to ${phone}`);
  } catch (err) {
    broadcast("ai_typing", { phone, typing: false });
    console.error(`[Bot] Failed for ${phone}:`, err.message);
  }
};
