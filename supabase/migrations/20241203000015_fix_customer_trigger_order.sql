-- Fix customer trigger execution order and ensure proper business_id handling
-- This migration ensures that the customer CRM trigger fires correctly

-- Drop and recreate the customer creation trigger with better error handling
DROP TRIGGER IF EXISTS on_new_customer_to_crm ON customers;

-- Recreate the function with improved logging and error handling
CREATE OR REPLACE FUNCTION handle_new_customer_to_crm()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
    v_crm_business_id TEXT;
    v_customer_name TEXT;
    v_trigger_result TEXT;
BEGIN
    -- Log the trigger execution
    RAISE NOTICE '🔄 Customer CRM trigger fired for customer ID: %, email: %, business_id: %', 
        NEW.id, NEW.email, NEW.business_id;
    
    -- Get business name for logging
    SELECT name INTO v_business_name
    FROM businesses
    WHERE id = NEW.business_id;
    
    -- Map business ID to CRM business ID
    CASE NEW.business_id
        WHEN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d' THEN
            v_crm_business_id := '9c38d437-b6c9-425a-9199-d514007fcb63';
            RAISE NOTICE '✅ Business ID mapped: % -> %', NEW.business_id, v_crm_business_id;
        ELSE
            v_crm_business_id := NULL;
            RAISE NOTICE '⚠️ No CRM mapping found for business ID: %', NEW.business_id;
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
        RAISE NOTICE '📧 Sending customer to CRM: % (email: %) for business: %', 
            v_customer_name, NEW.email, v_business_name;
        
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
                'businessId', NEW.business_id,
                'isNewCustomer', true,
                'customerId', NEW.id,
                'externalId', COALESCE(NEW.external_id, ''),
                'dateOfBirth', COALESCE(NEW.date_of_birth::text, ''),
                'preferences', COALESCE(NEW.preferences, '{}'::jsonb)
            )
        );
        
        v_trigger_result := 'sent to CRM';
        RAISE NOTICE '✅ Customer % (email: %) sent to CRM for business % (CRM ID: %)', 
            v_customer_name, NEW.email, v_business_name, v_crm_business_id;
    ELSE
        v_trigger_result := 'no CRM mapping';
        RAISE NOTICE '⚠️ No CRM mapping found for business % (ID: %), customer not sent to CRM', 
            v_business_name, NEW.business_id;
    END IF;
    
    -- Log final result
    RAISE NOTICE '🏁 Customer CRM trigger completed for customer %: %', NEW.id, v_trigger_result;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the customer creation
        RAISE WARNING '❌ Failed to send new customer % to CRM: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after customer insertion
CREATE TRIGGER on_new_customer_to_crm
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_customer_to_crm();

-- Also add a trigger for customer updates to handle cases where business_id might be updated
CREATE OR REPLACE FUNCTION handle_customer_update_to_crm()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
    v_crm_business_id TEXT;
    v_customer_name TEXT;
BEGIN
    -- Only process if business_id changed and we have a valid mapping
    IF OLD.business_id = NEW.business_id THEN
        RETURN NEW;
    END IF;
    
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
    
    -- Only send to CRM if we have a valid business mapping
    IF v_crm_business_id IS NOT NULL THEN
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
        
        RAISE NOTICE '📧 Sending updated customer to CRM: % (email: %) for business: %', 
            v_customer_name, NEW.email, v_business_name;
        
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
                'restaurantId', 'customer-update',
                'restaurantName', COALESCE(v_business_name, 'Unknown Business'),
                'bookingDate', CURRENT_DATE::text,
                'startTime', '00:00',
                'partySize', 0,
                'bookingId', 'customer-update-' || NEW.id,
                'businessId', NEW.business_id,
                'isNewCustomer', true,
                'customerId', NEW.id,
                'externalId', COALESCE(NEW.external_id, ''),
                'dateOfBirth', COALESCE(NEW.date_of_birth::text, ''),
                'preferences', COALESCE(NEW.preferences, '{}'::jsonb)
            )
        );
        
        RAISE NOTICE '✅ Updated customer % (email: %) sent to CRM for business % (CRM ID: %)', 
            v_customer_name, NEW.email, v_business_name, v_crm_business_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the customer update
        RAISE WARNING '❌ Failed to send updated customer % to CRM: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after customer updates
DROP TRIGGER IF EXISTS on_customer_update_to_crm ON customers;
CREATE TRIGGER on_customer_update_to_crm
    AFTER UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION handle_customer_update_to_crm();

-- Verify the triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_new_customer_to_crm', 'on_customer_update_to_crm')
ORDER BY trigger_name; 