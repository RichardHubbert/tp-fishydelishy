-- Fix businesses table to handle created_by column constraint
-- This migration handles the case where the businesses table has a created_by column that requires a value

-- First, let's see what columns exist in the businesses table
-- Then we'll handle the created_by column properly

-- Add created_by column if it doesn't exist, or make it nullable if it exists
DO $$
BEGIN
    -- Check if created_by column exists
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

-- Now make created_by NOT NULL if it was nullable
DO $$
BEGIN
    -- Make created_by NOT NULL with a default value
    ALTER TABLE businesses ALTER COLUMN created_by SET NOT NULL;
    ALTER TABLE businesses ALTER COLUMN created_by SET DEFAULT '00000000-0000-0000-0000-000000000000'::UUID;
EXCEPTION
    WHEN others THEN
        -- If there are still NULL values, keep it nullable
        NULL;
END $$;

-- Insert Amici Coffee business with proper created_by value
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
    created_by = '00000000-0000-0000-0000-000000000000'::UUID,
    updated_at = NOW();

-- Create the get_business_customers function if it doesn't exist
CREATE OR REPLACE FUNCTION get_business_customers(business_slug TEXT)
RETURNS TABLE (
    customer_id UUID,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    total_bookings INTEGER,
    last_booking_date DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.email,
        c.first_name,
        c.last_name,
        c.phone,
        c.total_bookings,
        c.last_booking_date,
        c.created_at
    FROM customers c
    JOIN businesses b ON c.business_id = b.id
    WHERE b.slug = get_business_customers.business_slug
    AND b.is_active = true
    ORDER BY c.last_booking_date DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create the sync_customer_from_external function if it doesn't exist
CREATE OR REPLACE FUNCTION sync_customer_from_external(
    p_business_slug TEXT,
    p_external_id TEXT,
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_date_of_birth DATE DEFAULT NULL,
    p_preferences JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
    v_customer_id UUID;
BEGIN
    -- Get business ID
    SELECT id INTO v_business_id
    FROM businesses
    WHERE slug = p_business_slug AND is_active = true;
    
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'Business not found or inactive: %', p_business_slug;
    END IF;
    
    -- Insert or update customer
    INSERT INTO customers (
        business_id, external_id, email, first_name, last_name, 
        phone, date_of_birth, preferences
    ) VALUES (
        v_business_id, p_external_id, p_email, p_first_name, p_last_name,
        p_phone, p_date_of_birth, p_preferences
    )
    ON CONFLICT (business_id, external_id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        date_of_birth = EXCLUDED.date_of_birth,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
    RETURNING id INTO v_customer_id;
    
    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql; 