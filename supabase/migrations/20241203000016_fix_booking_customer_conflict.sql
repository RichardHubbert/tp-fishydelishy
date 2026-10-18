-- Fix booking customer creation to handle business_id conflicts properly
-- The issue is that ON CONFLICT (business_id, email) doesn't update business_id if it's different

-- Update the booking customer creation function to handle business_id conflicts
CREATE OR REPLACE FUNCTION handle_booking_customer_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_business_id UUID;
    v_customer_id UUID;
    v_first_name VARCHAR(100);
    v_last_name VARCHAR(100);
    v_existing_customer_id UUID;
BEGIN
    -- Get business ID from the booking
    v_business_id := NEW.business_id;
    
    -- If no business_id, use Amici Coffee as default
    IF v_business_id IS NULL THEN
        v_business_id := '24e2799f-60d5-4e3b-bb30-b8049c9ae56d';
    END IF;
    
    -- Split customer name into first and last name
    IF NEW.customer_name LIKE '% %' THEN
        v_first_name := SPLIT_PART(NEW.customer_name, ' ', 1);
        v_last_name := SPLIT_PART(NEW.customer_name, ' ', 2);
    ELSE
        v_first_name := NEW.customer_name;
        v_last_name := NULL;
    END IF;
    
    -- Check if customer already exists with this email (regardless of business_id)
    SELECT id INTO v_existing_customer_id
    FROM customers 
    WHERE email = NEW.customer_email;
    
    IF v_existing_customer_id IS NOT NULL THEN
        -- Customer exists, update their business_id and other info
        UPDATE customers 
        SET 
            business_id = v_business_id,
            first_name = v_first_name,
            last_name = v_last_name,
            phone = NEW.customer_phone,
            total_bookings = total_bookings + 1,
            last_booking_date = CASE 
                WHEN NEW.booking_date > last_booking_date 
                THEN NEW.booking_date 
                ELSE last_booking_date 
            END,
            updated_at = NOW()
        WHERE id = v_existing_customer_id;
        
        v_customer_id := v_existing_customer_id;
        
        RAISE NOTICE 'Customer record updated for email % (business: % -> %)', 
            NEW.customer_email, v_business_id, v_business_id;
    ELSE
        -- Customer doesn't exist, create new record
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
        ) VALUES (
            v_business_id,
            NEW.customer_email,
            v_first_name,
            v_last_name,
            NEW.customer_phone,
            1,
            NEW.booking_date,
            NOW(),
            NOW()
        ) RETURNING id INTO v_customer_id;
        
        RAISE NOTICE 'Customer record created for email % (business: %)', 
            NEW.customer_email, v_business_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the booking creation
        RAISE WARNING 'Failed to create/update customer record for booking %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update the booking customer update function
CREATE OR REPLACE FUNCTION handle_booking_customer_update()
RETURNS TRIGGER AS $$
DECLARE
    v_business_id UUID;
    v_first_name VARCHAR(100);
    v_last_name VARCHAR(100);
BEGIN
    -- Only process if customer information changed
    IF OLD.customer_email = NEW.customer_email AND 
       OLD.customer_name = NEW.customer_name AND 
       OLD.customer_phone = NEW.customer_phone AND
       OLD.business_id = NEW.business_id THEN
        RETURN NEW;
    END IF;
    
    -- Get business ID from the booking
    v_business_id := NEW.business_id;
    
    -- If no business_id, use Amici Coffee as default
    IF v_business_id IS NULL THEN
        v_business_id := '24e2799f-60d5-4e3b-bb30-b8049c9ae56d';
    END IF;
    
    -- Split customer name into first and last name
    IF NEW.customer_name LIKE '% %' THEN
        v_first_name := SPLIT_PART(NEW.customer_name, ' ', 1);
        v_last_name := SPLIT_PART(NEW.customer_name, ' ', 2);
    ELSE
        v_first_name := NEW.customer_name;
        v_last_name := NULL;
    END IF;
    
    -- Update customer record (find by email, not business_id + email)
    UPDATE customers 
    SET 
        business_id = v_business_id,
        first_name = v_first_name,
        last_name = v_last_name,
        phone = NEW.customer_phone,
        last_booking_date = CASE 
            WHEN NEW.booking_date > last_booking_date 
            THEN NEW.booking_date 
            ELSE last_booking_date 
        END,
        updated_at = NOW()
    WHERE email = NEW.customer_email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the booking update
        RAISE WARNING 'Failed to update customer record for booking %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the functions are updated
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_booking_customer_creation', 'handle_booking_customer_update')
ORDER BY routine_name; 