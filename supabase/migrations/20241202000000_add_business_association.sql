-- Add business_id to profiles table for better business association
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES restaurants(id);

-- Add business_id to bookings table for explicit business association
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES restaurants(id);

-- Create index for business_id queries
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);

-- Update existing bookings to associate with Amici Coffee
UPDATE bookings 
SET business_id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'
WHERE business_id IS NULL;

-- Update existing profiles to associate with Amici Coffee
UPDATE profiles 
SET business_id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'
WHERE business_id IS NULL AND role = 'user';

-- Create a view for customer analytics
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    b.business_id,
    r.name as business_name,
    b.customer_email,
    b.customer_name,
    b.customer_phone,
    COUNT(*) as total_bookings,
    MIN(b.booking_date) as first_booking,
    MAX(b.booking_date) as last_booking,
    SUM(b.party_size) as total_guests,
    AVG(b.party_size) as avg_party_size
FROM bookings b
JOIN restaurants r ON b.business_id = r.id
WHERE b.status != 'cancelled'
GROUP BY b.business_id, r.name, b.customer_email, b.customer_name, b.customer_phone;

-- Create a function to get customer history
CREATE OR REPLACE FUNCTION get_customer_history(customer_email TEXT, business_id UUID DEFAULT '24e2799f-60d5-4e3b-bb30-b8049c9ae56d')
RETURNS TABLE (
    booking_id UUID,
    booking_date DATE,
    start_time TIME,
    party_size INTEGER,
    status TEXT,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.booking_date,
        b.start_time,
        b.party_size,
        b.status,
        b.special_requests,
        b.created_at
    FROM bookings b
    WHERE b.customer_email = get_customer_history.customer_email
    AND b.business_id = get_customer_history.business_id
    ORDER BY b.booking_date DESC, b.start_time DESC;
END;
$$ LANGUAGE plpgsql; 