-- Test script to manually insert a customer and trigger the CRM integration
-- Run this in your Supabase SQL editor to test the trigger

-- First, let's check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_new_customer_to_crm';

-- Insert a test customer to trigger the CRM integration
INSERT INTO customers (
    business_id,
    email,
    first_name,
    last_name,
    phone,
    external_id,
    date_of_birth,
    preferences,
    total_bookings,
    last_booking_date,
    created_at,
    updated_at
) VALUES (
    '24e2799f-60d5-4e3b-bb30-b8049c9ae56d', -- Amici Coffee business ID
    'test-customer-' || EXTRACT(EPOCH FROM NOW()) || '@example.com',
    'Test',
    'Customer',
    '+44 20 7946 0960',
    'ext-test-' || EXTRACT(EPOCH FROM NOW()),
    '1995-06-15',
    '{"dietary_restrictions": "none", "preferred_seating": "any"}',
    0,
    NULL,
    NOW(),
    NOW()
);

-- Check if the customer was created
SELECT 
    id,
    business_id,
    email,
    first_name,
    last_name,
    phone,
    external_id,
    date_of_birth,
    preferences,
    created_at
FROM customers 
WHERE email LIKE 'test-customer-%@example.com'
ORDER BY created_at DESC
LIMIT 1; 