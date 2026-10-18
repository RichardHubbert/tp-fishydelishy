-- Add missing slug column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- Update existing Amici Coffee record with slug if it doesn't have one
UPDATE businesses 
SET slug = 'amicicoffee'
WHERE id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d' 
AND (slug IS NULL OR slug = '');

-- Make slug NOT NULL after ensuring existing records have values
ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL; 