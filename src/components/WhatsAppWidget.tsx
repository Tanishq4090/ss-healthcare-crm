import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, MessageCircle, Phone, X } from 'lucide-react';

const PHONE_NUMBER = '917971542924';
const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent('Hi, I need help with a healthcare service')}`;

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            className="mb-4 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight">SS Health Care</h4>
                  <p className="text-[11px] text-green-100">Manual WhatsApp support</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Close WhatsApp panel">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-5">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-xl border border-[#25D366]/30 bg-white p-4 shadow-sm transition hover:border-[#25D366]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/10">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">Open WhatsApp</h4>
                  <p className="text-xs text-slate-500">Send a prefilled message</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>

              <a href="tel:+917971542924" className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
                  <Phone className="h-5 w-5 text-teal-700" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">Call SS Health Care</h4>
                  <p className="text-xs text-slate-500">Speak with the team manually</p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((current) => !current)}
        className="relative z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Open WhatsApp contact"
      >
        <MessageCircle className="h-7 w-7" />
      </motion.button>
    </div>
  );
}
