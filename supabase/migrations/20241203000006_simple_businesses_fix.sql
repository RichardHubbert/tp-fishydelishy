-- Simple fix for businesses table - add slug column first
-- This migration handles the case where the businesses table exists but is missing the slug column

-- First, add the slug column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'slug') THEN
        ALTER TABLE businesses ADD COLUMN slug VARCHAR(100);
        -- Add unique constraint
        ALTER TABLE businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Add other missing columns if they don't exist
DO $$
BEGIN
    -- Add domain column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'domain') THEN
        ALTER TABLE businesses ADD COLUMN domain VARCHAR(255);
    END IF;
    
    -- Add contact_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'contact_email') THEN
        ALTER TABLE businesses ADD COLUMN contact_email VARCHAR(255);
    END IF;
    
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'address') THEN
        ALTER TABLE businesses ADD COLUMN address TEXT;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'created_by') THEN
        -- If it exists, make it nullable to avoid constraint issues
        ALTER TABLE businesses ALTER COLUMN created_by DROP NOT NULL;
    ELSE
        -- If it doesn't exist, add it as nullable
        ALTER TABLE businesses ADD COLUMN created_by UUID;
    END IF;
END $$;

-- Update existing businesses to have a created_by value
UPDATE businesses 
SET created_by = '00000000-0000-0000-0000-000000000000'::UUID
WHERE created_by IS NULL;

-- Now insert Amici Coffee business with all required columns
INSERT INTO businesses (
    id, 
    name, 
    slug, 
    domain, 
    contact_email, 
    address, 
    created_by
) VALUES (
    '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
    'Amici Coffee',
    'amicicoffee',
    'amicicoffee.tablepilot.co.uk',
    'info@amicicoffee.com',
    '123 Fine Dining Street, London, UK',
    '00000000-0000-0000-0000-000000000000'::UUID
) ON CONFLICT (id) DO UPDATE SET
    name = 'Amici Coffee',
    slug = 'amicicoffee',
    domain = 'amicicoffee.tablepilot.co.uk',
    contact_email = 'info@amicicoffee.com',
    address = '123 Fine Dining Street, London, UK',
    created_by = '00000000-0000-0000-0000-000000000000'::UUID;

-- Create index on slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug); 