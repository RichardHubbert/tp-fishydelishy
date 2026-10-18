-- Fix businesses table structure and ensure all required columns exist
-- This migration handles cases where the businesses table exists but is missing columns

-- First, ensure the businesses table exists with all required columns
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing businesses table
DO $$
BEGIN
    -- Add slug column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'slug') THEN
        ALTER TABLE businesses ADD COLUMN slug VARCHAR(100);
        -- Add unique constraint after adding the column
        ALTER TABLE businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);
    END IF;
    
    -- Add domain column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'domain') THEN
        ALTER TABLE businesses ADD COLUMN domain VARCHAR(255);
    END IF;
    
    -- Add logo_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'logo_url') THEN
        ALTER TABLE businesses ADD COLUMN logo_url TEXT;
    END IF;
    
    -- Add primary_color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'primary_color') THEN
        ALTER TABLE businesses ADD COLUMN primary_color VARCHAR(7) DEFAULT '#000000';
    END IF;
    
    -- Add secondary_color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'secondary_color') THEN
        ALTER TABLE businesses ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#ffffff';
    END IF;
    
    -- Add contact_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'contact_email') THEN
        ALTER TABLE businesses ADD COLUMN contact_email VARCHAR(255);
    END IF;
    
    -- Add contact_phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'contact_phone') THEN
        ALTER TABLE businesses ADD COLUMN contact_phone VARCHAR(20);
    END IF;
    
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'address') THEN
        ALTER TABLE businesses ADD COLUMN address TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_active') THEN
        ALTER TABLE businesses ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'created_at') THEN
        ALTER TABLE businesses ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'updated_at') THEN
        ALTER TABLE businesses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);

-- Insert Amici Coffee business with proper slug
INSERT INTO businesses (id, name, slug, domain, contact_email, address) 
VALUES (
  '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
  'Amici Coffee',
  'amicicoffee',
  'amicicoffee.tablepilot.co.uk',
  'info@amicicoffee.com',
  '123 Fine Dining Street, London, UK'
) ON CONFLICT (id) DO UPDATE SET
  name = 'Amici Coffee',
  slug = 'amicicoffee',
  domain = 'amicicoffee.tablepilot.co.uk',
  contact_email = 'info@amicicoffee.com',
  address = '123 Fine Dining Street, London, UK',
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

-- Create a function to get current business ID
CREATE OR REPLACE FUNCTION get_current_business_id()
RETURNS UUID AS $$
BEGIN
    -- For now, return Amici Coffee business ID
    -- In production, this would be determined by domain, subdomain, or user context
    RETURN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'::UUID;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get Amici Coffee business ID
CREATE OR REPLACE FUNCTION get_amici_coffee_business_id()
RETURNS UUID AS $$
BEGIN
    RETURN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'::UUID;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get Amici Coffee restaurant ID
CREATE OR REPLACE FUNCTION get_amici_coffee_restaurant_id()
RETURNS UUID AS $$
BEGIN
    RETURN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'::UUID;
END;
$$ LANGUAGE plpgsql; 