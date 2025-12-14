-- Create a new storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view images
CREATE POLICY "Public Access Profiles" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'profile-images' );

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload Profiles" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'profile-images' );

-- Policy: Allow authenticated users to update their images
CREATE POLICY "Authenticated Update Profiles" 
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'profile-images' );

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated Delete Profiles" 
ON storage.objects FOR DELETE
TO authenticated 
USING ( bucket_id = 'profile-images' );
