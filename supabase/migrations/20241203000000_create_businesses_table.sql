-- Create businesses table for multi-tenant support
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

-- Create customers table for business-specific customer management
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- ID from the other application
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  preferences JSONB,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_booking_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, email),
  UNIQUE(business_id, external_id)
);

-- Update existing restaurants to be associated with businesses
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Update existing bookings to use business_id from restaurants
UPDATE bookings 
SET business_id = r.business_id
FROM restaurants r
WHERE bookings.restaurant_id = r.id
AND bookings.business_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_external_id ON customers(external_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_business_id ON restaurants(business_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default business (Amici Coffee)
INSERT INTO businesses (id, name, slug, domain, contact_email, address) 
VALUES (
  '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
  'Amici Coffee',
  'amicicoffee',
  'amicicoffee.tablepilot.co.uk',
  'info@amicicoffee.com',
  '123 Coffee Street, Downtown'
) ON CONFLICT (id) DO NOTHING;

-- Update existing restaurants to be associated with Amici Coffee
UPDATE restaurants 
SET business_id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'
WHERE business_id IS NULL;

-- Create a view for business-specific customer analytics
CREATE OR REPLACE VIEW business_customer_analytics AS
SELECT 
    b.business_id,
    bus.name as business_name,
    b.customer_email,
    b.customer_name,
    b.customer_phone,
    COUNT(*) as total_bookings,
    MIN(b.booking_date) as first_booking,
    MAX(b.booking_date) as last_booking,
    SUM(b.party_size) as total_guests,
    AVG(b.party_size) as avg_party_size,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
FROM bookings b
JOIN businesses bus ON b.business_id = bus.id
WHERE b.status != 'cancelled'
GROUP BY b.business_id, bus.name, b.customer_email, b.customer_name, b.customer_phone;

-- Create a function to get customers for a specific business
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

-- Create a function to sync customer from external system
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

-- Enable RLS on new tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for businesses
CREATE POLICY "Businesses are viewable by authenticated users" ON businesses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Businesses are manageable by admin" ON businesses
    FOR ALL USING (auth.jwt() ->> 'email' = 'richardhubbert@gmail.com');

-- Create RLS policies for customers
CREATE POLICY "Customers are viewable by business admin" ON customers
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE slug = current_setting('app.business_slug', true)::TEXT
        )
    );

CREATE POLICY "Customers are manageable by business admin" ON customers
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE slug = current_setting('app.business_slug', true)::TEXT
        )
    ); 