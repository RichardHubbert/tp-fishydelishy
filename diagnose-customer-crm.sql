-- Diagnostic script to troubleshoot customer CRM integration
-- Run this in your Supabase SQL editor to check the current state

-- 1. Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%customer%' OR trigger_name LIKE '%crm%'
ORDER BY trigger_name;

-- 2. Check recent customer creations
SELECT 
    id,
    business_id,
    email,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check recent bookings and their business_id
SELECT 
    b.id as booking_id,
    b.business_id,
    b.customer_email,
    b.customer_name,
    b.created_at as booking_created,
    c.id as customer_id,
    c.business_id as customer_business_id,
    c.created_at as customer_created
FROM bookings b
LEFT JOIN customers c ON b.customer_email = c.email AND b.business_id = c.business_id
ORDER BY b.created_at DESC 
LIMIT 10;

-- 4. Check if business exists
SELECT 
    id,
    name,
    slug,
    is_active
FROM businesses 
WHERE id = '24e2799f-60d5-4e3b-bb30-b8049c9ae56d';

-- 5. Check HTTP extension
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'http';

-- 6. Test the trigger function manually
DO $$
DECLARE
    v_test_customer_id UUID;
    v_result TEXT;
BEGIN
    -- Insert a test customer to trigger the CRM function
    INSERT INTO customers (
        business_id,
        email,
        first_name,
        last_name,
        phone,
        created_at,
        updated_at
    ) VALUES (
        '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
        'diagnostic-test-' || EXTRACT(EPOCH FROM NOW()) || '@example.com',
        'Diagnostic',
        'Test',
        '+44 20 7946 0961',
        NOW(),
        NOW()
    ) RETURNING id INTO v_test_customer_id;
    
    RAISE NOTICE 'Test customer created with ID: %', v_test_customer_id;
    
    -- Check if the customer was created
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 'Customer created successfully'
            ELSE 'Customer creation failed'
        END INTO v_result
    FROM customers 
    WHERE id = v_test_customer_id;
    
    RAISE NOTICE 'Result: %', v_result;
    
    -- Clean up the test customer
    DELETE FROM customers WHERE id = v_test_customer_id;
    RAISE NOTICE 'Test customer cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during diagnostic test: %', SQLERRM;
END $$;

-- 7. Check for any recent errors in the logs
-- (This will show recent NOTICE and WARNING messages)
-- Note: You may need to check the Supabase dashboard logs for this information 