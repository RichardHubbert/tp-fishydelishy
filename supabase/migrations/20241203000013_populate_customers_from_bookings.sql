-- Populate customers table with existing booking data
-- This ensures all customers who have made bookings are properly represented in the customers table

-- Insert customers from existing bookings (if they don't already exist)
INSERT INTO customers (
    business_id,
    email,
    first_name,
    last_name,
    phone,
    total_bookings,
    last_booking_date,
    created_at,
    updated_at
)
SELECT 
    COALESCE(b.business_id, '24e2799f-60d5-4e3b-bb30-b8049c9ae56d') as business_id,
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
    MAX(b.booking_date) as last_booking_date,
    MIN(b.created_at) as created_at,
    NOW() as updated_at
FROM bookings b
WHERE b.customer_email IS NOT NULL 
AND b.customer_email != ''
GROUP BY 
    COALESCE(b.business_id, '24e2799f-60d5-4e3b-bb30-b8049c9ae56d'),
    b.customer_email,
    b.customer_name,
    b.customer_phone
ON CONFLICT (business_id, email) 
DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    total_bookings = EXCLUDED.total_bookings,
    last_booking_date = CASE 
        WHEN EXCLUDED.last_booking_date > customers.last_booking_date 
        THEN EXCLUDED.last_booking_date 
        ELSE customers.last_booking_date 
    END,
    updated_at = NOW();

-- Log the results
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count FROM customers;
    RAISE NOTICE 'Customers table now contains % customer records', customer_count;
END $$; 