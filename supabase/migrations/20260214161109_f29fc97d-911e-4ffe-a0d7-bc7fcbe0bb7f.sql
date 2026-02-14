-- Add image_url column to products table for product photos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;