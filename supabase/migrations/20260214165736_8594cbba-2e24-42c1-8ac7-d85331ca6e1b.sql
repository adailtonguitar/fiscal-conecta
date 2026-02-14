
-- Add WhatsApp support number to resellers for white-label
ALTER TABLE public.resellers ADD COLUMN whatsapp_support text DEFAULT NULL;

-- Add WhatsApp support number to companies as well
ALTER TABLE public.companies ADD COLUMN whatsapp_support text DEFAULT NULL;
