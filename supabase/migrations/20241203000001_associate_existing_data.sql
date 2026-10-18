-- Associate all existing data with the business
-- This ensures proper multi-tenant isolation

-- First, ensure the Amici Coffee business exists
INSERT INTO businesses (id, name, slug, domain, contact_email, address) 
VALUES (
  '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
  'Amici Coffee',
  'amicicoffee',
  'amicicoffee.tablepilot.co.uk',
  'info@amicicoffee.com',
  '123 Coffee Street, Downtown'
) ON CONFLICT (id) DO NOTHING;

-- Associate all existing restaurants with Amici Coffee business
UPDATE restaurants 
SET business_id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'
WHERE business_id IS NULL;

-- Associate all existing bookings with the business_id from their restaurant
UPDATE bookings 
SET business_id = r.business_id
FROM restaurants r
WHERE bookings.restaurant_id = r.id
AND bookings.business_id IS NULL;

-- For any bookings that don't have a restaurant_id, associate them with Amici Coffee
UPDATE bookings 
SET business_id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'
WHERE business_id IS NULL;

-- Associate all existing profiles (users) with Amici Coffee business
UPDATE profiles 
SET business_id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'
WHERE business_id IS NULL;

-- Create customers from existing booking data
-- This will create customer records for all people who have made bookings
INSERT INTO customers (business_id, email, first_name, last_name, phone, total_bookings, last_booking_date)
SELECT 
    b.business_id,
    b.customer_email,
    CASE 
        WHEN b.customer_name LIKE '% %' THEN 
            SPLIT_PART(b.customer_name, ' ', 1)
        ELSE b.customer_name
    END as first_name,
    CASE 
        WHEN b.customer_name LIKE '% %' THEN 
            SPLIT_PART(b.customer_name, ' ', 2)
        ELSE NULL
    END as last_name,
    b.customer_phone,
    COUNT(*) as total_bookings,
    MAX(b.booking_date) as last_booking_date
FROM bookings b
WHERE b.business_id IS NOT NULL
GROUP BY b.business_id, b.customer_email, b.customer_name, b.customer_phone
ON CONFLICT (business_id, email) DO UPDATE SET
    total_bookings = EXCLUDED.total_bookings,
    last_booking_date = EXCLUDED.last_booking_date,
    updated_at = NOW();

-- Update customer total_spent (assuming a default value for now)
-- You can update this with actual spending data when available
UPDATE customers 
SET total_spent = total_bookings * 50.00 -- Assuming average booking value of $50
WHERE total_spent = 0;

-- Create a function to get current business context
CREATE OR REPLACE FUNCTION get_current_business_id()
RETURNS UUID AS $$
BEGIN
    -- For now, return Amici Coffee business ID
    -- In production, this would be determined by domain, subdomain, or user context
    RETURN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'::UUID;
END;
$$ LANGUAGE plpgsql;

-- Create a function to set business context for RLS
CREATE OR REPLACE FUNCTION set_business_context(business_slug TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.business_slug', business_slug, false);
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to use business context
DROP POLICY IF EXISTS "Customers are viewable by business admin" ON customers;
CREATE POLICY "Customers are viewable by business admin" ON customers
    FOR SELECT USING (
        business_id = get_current_business_id()
    );

DROP POLICY IF EXISTS "Customers are manageable by business admin" ON customers;
CREATE POLICY "Customers are manageable by business admin" ON customers
    FOR ALL USING (
        business_id = get_current_business_id()
    );

-- Update bookings RLS to use business context
DROP POLICY IF EXISTS "Bookings are viewable by business admin" ON bookings;
CREATE POLICY "Bookings are viewable by business admin" ON bookings
    FOR SELECT USING (
        business_id = get_current_business_id()
    );

DROP POLICY IF EXISTS "Bookings are manageable by business admin" ON bookings;
CREATE POLICY "Bookings are manageable by business admin" ON bookings
    FOR ALL USING (
        business_id = get_current_business_id()
    );

-- Update restaurants RLS to use business context
DROP POLICY IF EXISTS "Restaurants are viewable by business admin" ON restaurants;
CREATE POLICY "Restaurants are viewable by business admin" ON restaurants
    FOR SELECT USING (
        business_id = get_current_business_id()
    );

DROP POLICY IF EXISTS "Restaurants are manageable by business admin" ON restaurants;
CREATE POLICY "Restaurants are manageable by business admin" ON restaurants
    FOR ALL USING (
        business_id = get_current_business_id()
    );

-- Create a view for business dashboard data
CREATE OR REPLACE VIEW business_dashboard AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    b.slug as business_slug,
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT bk.id) as total_bookings,
    COUNT(DISTINCT r.id) as total_restaurants,
    AVG(bk.party_size) as avg_party_size,
    SUM(CASE WHEN bk.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
    SUM(CASE WHEN bk.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(CASE WHEN bk.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
FROM businesses b
LEFT JOIN customers c ON b.id = c.business_id
LEFT JOIN bookings bk ON b.id = bk.business_id
LEFT JOIN restaurants r ON b.id = r.business_id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.slug;

-- Create a function to get business context from domain
CREATE OR REPLACE FUNCTION get_business_from_domain(domain_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
BEGIN
    SELECT id INTO v_business_id
    FROM businesses
    WHERE domain = domain_name AND is_active = true;
    
    RETURN v_business_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the multi-tenant structure
COMMENT ON TABLE businesses IS 'Multi-tenant business table - each business is a separate tenant';
COMMENT ON TABLE customers IS 'Customers associated with specific businesses for multi-tenant isolation';
COMMENT ON TABLE bookings IS 'Bookings associated with specific businesses via business_id';
COMMENT ON TABLE restaurants IS 'Restaurants associated with specific businesses via business_id';
COMMENT ON TABLE profiles IS 'User profiles associated with specific businesses via business_id';

COMMENT ON COLUMN customers.business_id IS 'Foreign key to businesses table - ensures customer isolation per business';
COMMENT ON COLUMN bookings.business_id IS 'Foreign key to businesses table - ensures booking isolation per business';
COMMENT ON COLUMN restaurants.business_id IS 'Foreign key to businesses table - ensures restaurant isolation per business';
COMMENT ON COLUMN profiles.business_id IS 'Foreign key to businesses table - ensures user isolation per business'; 