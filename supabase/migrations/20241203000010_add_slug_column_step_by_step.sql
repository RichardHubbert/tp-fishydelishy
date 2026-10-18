-- Step 1: Add the slug column (allows NULL initially)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Step 2: Populate existing records with appropriate slugs
UPDATE businesses 
SET slug = CASE 
    WHEN name ILIKE '%amici%' OR name ILIKE '%coffee%' THEN 'amicicoffee'
    WHEN name IS NOT NULL THEN LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
    ELSE 'business-' || id::text
END
WHERE slug IS NULL OR slug = '';

-- Step 3: Handle any remaining NULL values
UPDATE businesses 
SET slug = 'business-' || id::text
WHERE slug IS NULL OR slug = '';

-- Step 4: Now make the column NOT NULL
ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug); 