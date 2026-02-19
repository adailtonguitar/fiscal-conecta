
-- Remove tables in correct order (dependencies first)
DROP TABLE IF EXISTS public.consumo_quarto CASCADE;
DROP TABLE IF EXISTS public.catalogo_produtos CASCADE;
DROP TABLE IF EXISTS public.catalogo_diario CASCADE;
DROP TABLE IF EXISTS public.hotel_produtos CASCADE;
DROP TABLE IF EXISTS public.hotel_categorias CASCADE;
DROP TABLE IF EXISTS public.hospedes CASCADE;
DROP TABLE IF EXISTS public.quartos CASCADE;
