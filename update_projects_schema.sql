-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type text CHECK (project_type IN ('Flat/Apartment', 'Residential Land (Plotting)', 'Serviced Apartments', 'Residential Land', '1 RK/ Studio Apartment', 'Independent House/Villa', 'Farm House', 'Duplex', 'Other')),
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Running' CHECK (status IN ('Running', 'Closed', 'Hold'));

-- Update existing records to have defaults
UPDATE projects SET status = 'Running' WHERE status IS NULL;
UPDATE projects SET project_type = 'Other' WHERE project_type IS NULL;
