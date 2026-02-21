
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt TEF secrets before insert/update
CREATE OR REPLACE FUNCTION public.encrypt_tef_secrets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a consistent encryption key derived from the service role key
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  
  -- If encryption key is not available, use a fallback from the database
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := encode(digest(gen_random_uuid()::text || NEW.company_id::text, 'sha256'), 'hex');
  END IF;

  -- Encrypt api_key if provided and not already encrypted
  IF NEW.api_key IS NOT NULL AND NEW.api_key != '' AND NOT starts_with(COALESCE(NEW.api_key, ''), '\\xc3') THEN
    NEW.api_key := encode(pgp_sym_encrypt(NEW.api_key, encryption_key), 'base64');
  END IF;

  -- Encrypt api_secret if provided
  IF NEW.api_secret IS NOT NULL AND NEW.api_secret != '' AND NOT starts_with(COALESCE(NEW.api_secret, ''), '\\xc3') THEN
    NEW.api_secret := encode(pgp_sym_encrypt(NEW.api_secret, encryption_key), 'base64');
  END IF;

  -- Encrypt merchant_id if provided
  IF NEW.merchant_id IS NOT NULL AND NEW.merchant_id != '' AND NOT starts_with(COALESCE(NEW.merchant_id, ''), '\\xc3') THEN
    NEW.merchant_id := encode(pgp_sym_encrypt(NEW.merchant_id, encryption_key), 'base64');
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for encryption on insert and update
DROP TRIGGER IF EXISTS encrypt_tef_secrets_trigger ON public.tef_configs;
CREATE TRIGGER encrypt_tef_secrets_trigger
  BEFORE INSERT OR UPDATE ON public.tef_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_tef_secrets();

-- Create a secure function to decrypt TEF secrets (only callable by authenticated company members)
CREATE OR REPLACE FUNCTION public.get_decrypted_tef_config(p_company_id uuid)
RETURNS TABLE(
  id uuid,
  company_id uuid,
  provider text,
  api_key text,
  api_secret text,
  merchant_id text,
  terminal_id text,
  environment text,
  auto_confirm boolean,
  max_installments integer,
  accepted_brands text[],
  is_active boolean,
  hardware_model text,
  connection_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Verify user is a company member
  IF NOT is_company_member(p_company_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');

  RETURN QUERY
  SELECT 
    t.id,
    t.company_id,
    t.provider,
    CASE 
      WHEN t.api_key IS NOT NULL AND t.api_key != '' THEN
        COALESCE(pgp_sym_decrypt(decode(t.api_key, 'base64'), encryption_key)::text, t.api_key)
      ELSE t.api_key
    END,
    CASE 
      WHEN t.api_secret IS NOT NULL AND t.api_secret != '' THEN
        COALESCE(pgp_sym_decrypt(decode(t.api_secret, 'base64'), encryption_key)::text, t.api_secret)
      ELSE t.api_secret
    END,
    CASE 
      WHEN t.merchant_id IS NOT NULL AND t.merchant_id != '' THEN
        COALESCE(pgp_sym_decrypt(decode(t.merchant_id, 'base64'), encryption_key)::text, t.merchant_id)
      ELSE t.merchant_id
    END,
    t.terminal_id,
    t.environment,
    t.auto_confirm,
    t.max_installments,
    t.accepted_brands,
    t.is_active,
    t.hardware_model,
    t.connection_type
  FROM public.tef_configs t
  WHERE t.company_id = p_company_id;
END;
$$;
