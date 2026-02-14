
ALTER TABLE public.tef_configs ADD COLUMN IF NOT EXISTS hardware_model text DEFAULT NULL;
ALTER TABLE public.tef_configs ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'usb';
