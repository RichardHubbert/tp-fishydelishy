-- Create trigger to automatically create customer records when bookings are created
-- This ensures customers are always created in the customers table when they make a booking

-- Function to handle customer creation from booking
CREATE OR REPLACE FUNCTION handle_booking_customer_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_business_id UUID;
    v_customer_id UUID;
    v_first_name VARCHAR(100);
    v_last_name VARCHAR(100);
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
    
    -- Insert or update customer record
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
    )
    ON CONFLICT (business_id, email) 
    DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        total_bookings = customers.total_bookings + 1,
        last_booking_date = CASE 
            WHEN EXCLUDED.last_booking_date > customers.last_booking_date 
            THEN EXCLUDED.last_booking_date 
            ELSE customers.last_booking_date 
        END,
        updated_at = NOW()
    RETURNING id INTO v_customer_id;
    
    -- Log the customer creation/update
    RAISE NOTICE 'Customer record % for email % (business: %)', 
        CASE WHEN v_customer_id IS NOT NULL THEN 'created/updated' ELSE 'failed' END,
        NEW.customer_email,
        v_business_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the booking creation
        RAISE WARNING 'Failed to create/update customer record for booking %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after booking insertion
DROP TRIGGER IF EXISTS on_booking_customer_creation ON bookings;
CREATE TRIGGER on_booking_customer_creation
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_customer_creation();

-- Also create a trigger for booking updates to keep customer data in sync
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
       OLD.customer_phone = NEW.customer_phone THEN
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
    
    -- Update customer record
    UPDATE customers 
    SET 
        first_name = v_first_name,
        last_name = v_last_name,
        phone = NEW.customer_phone,
        last_booking_date = CASE 
            WHEN NEW.booking_date > customers.last_booking_date 
            THEN NEW.booking_date 
            ELSE customers.last_booking_date 
        END,
        updated_at = NOW()
    WHERE business_id = v_business_id 
    AND email = NEW.customer_email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the booking update
        RAISE WARNING 'Failed to update customer record for booking %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after booking updates
DROP TRIGGER IF EXISTS on_booking_customer_update ON bookings;
CREATE TRIGGER on_booking_customer_update
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_customer_update(); 