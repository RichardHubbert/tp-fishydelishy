-- First, let's see what businesses exist and update them with appropriate slugs
UPDATE businesses 
SET slug = CASE 
    WHEN name ILIKE '%amici%' OR name ILIKE '%coffee%' THEN 'amicicoffee'
    WHEN name IS NOT NULL THEN LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
    ELSE 'business-' || id::text
END
WHERE slug IS NULL OR slug = '';

-- For any remaining NULL values, use a fallback
UPDATE businesses 
SET slug = 'business-' || id::text
WHERE slug IS NULL OR slug = '';

-- Now we can safely make the column NOT NULL
ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL;

-- Ensure the unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug); 