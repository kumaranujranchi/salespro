-- Create a new storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'project-images' );

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'project-images' );

-- Policy: Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'project-images' );

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE
TO authenticated 
USING ( bucket_id = 'project-images' );
