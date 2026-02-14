import { MessageCircle } from "lucide-react";
import { useWhatsAppSupport } from "@/hooks/useWhatsAppSupport";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppFloatingButton() {
  const { whatsappNumber, loading, openWhatsApp } = useWhatsAppSupport();

  if (loading || !whatsappNumber) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        onClick={() => openWhatsApp("Olá! Preciso de ajuda com o sistema.")}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="Suporte via WhatsApp"
        aria-label="Abrir WhatsApp para suporte"
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>
    </AnimatePresence>
  );
}
