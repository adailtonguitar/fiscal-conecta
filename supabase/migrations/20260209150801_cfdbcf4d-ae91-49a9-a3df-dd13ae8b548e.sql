
-- Create storage bucket for reseller logos
INSERT INTO storage.buckets (id, name, public) VALUES ('reseller-logos', 'reseller-logos', true);

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Reseller logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reseller-logos');

-- Allow reseller owners to upload logos
CREATE POLICY "Reseller owners can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);

-- Allow reseller owners to update logos
CREATE POLICY "Reseller owners can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);

-- Allow reseller owners to delete logos
CREATE POLICY "Reseller owners can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);
