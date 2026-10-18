-- Add all missing columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain);
CREATE INDEX IF NOT EXISTS idx_businesses_created_by ON businesses(created_by); 