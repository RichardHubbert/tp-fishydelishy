-- Create trigger to automatically send new customer data to CRM
-- This ensures new customers are sent to CRM even if they don't make a booking immediately

-- Function to handle sending new customer to CRM
CREATE OR REPLACE FUNCTION handle_new_customer_to_crm()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
    v_crm_business_id TEXT;
    v_customer_name TEXT;
BEGIN
    -- Get business name for logging
    SELECT name INTO v_business_name
    FROM businesses
    WHERE id = NEW.business_id;
    
    -- Map business ID to CRM business ID
    CASE NEW.business_id
        WHEN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d' THEN
            v_crm_business_id := '9c38d437-b6c9-425a-9199-d514007fcb63';
        ELSE
            v_crm_business_id := NULL;
    END CASE;
    
    -- Construct full customer name
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        v_customer_name := NEW.first_name || ' ' || NEW.last_name;
    ELSIF NEW.first_name IS NOT NULL THEN
        v_customer_name := NEW.first_name;
    ELSIF NEW.last_name IS NOT NULL THEN
        v_customer_name := NEW.last_name;
    ELSE
        v_customer_name := 'Unknown Customer';
    END IF;
    
    -- Only send to CRM if we have a valid business mapping
    IF v_crm_business_id IS NOT NULL THEN
        -- Call the CRM function asynchronously
        PERFORM net.http_post(
            url := 'https://mxrrvqnfxfigeofbhepv.supabase.co/functions/v1/send-customer-to-crm',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
            ),
            body := jsonb_build_object(
                'customerName', v_customer_name,
                'customerEmail', NEW.email,
                'customerPhone', COALESCE(NEW.phone, ''),
                'restaurantId', 'new-customer',
                'restaurantName', COALESCE(v_business_name, 'Unknown Business'),
                'bookingDate', CURRENT_DATE::text,
                'startTime', '00:00',
                'partySize', 0,
                'bookingId', 'customer-' || NEW.id,
                'businessId', v_crm_business_id, -- Use the mapped CRM business ID, not the booking platform business ID
                'isNewCustomer', true,
                'customerId', NEW.id
                -- Removed fields that don't exist in CRM schema
                -- 'externalId', COALESCE(NEW.external_id, ''),
                -- 'dateOfBirth', COALESCE(NEW.date_of_birth::text, ''),
                -- 'preferences', COALESCE(NEW.preferences, '{}'::jsonb)
            )
        );
        
        -- Log the CRM send attempt
        RAISE NOTICE 'New customer % (email: %) sent to CRM for business % (CRM ID: %)', 
            v_customer_name, NEW.email, v_business_name, v_crm_business_id;
    ELSE
        -- Log that no CRM mapping exists
        RAISE NOTICE 'No CRM mapping found for business % (ID: %), customer not sent to CRM', 
            v_business_name, NEW.business_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the customer creation
        RAISE WARNING 'Failed to send new customer % to CRM: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after customer insertion
DROP TRIGGER IF EXISTS on_new_customer_to_crm ON customers;
CREATE TRIGGER on_new_customer_to_crm
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_customer_to_crm();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions"; 