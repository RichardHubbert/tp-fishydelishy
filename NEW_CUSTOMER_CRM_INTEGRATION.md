# New Customer CRM Integration Setup

This guide explains how to set up the integration to automatically send new customer data from TablePilotPro to your CRM when a new customer is created.

## Overview

When a new customer is created in the `customers` table (either through a booking or manual creation), the system automatically sends their data to your CRM application via a Supabase Edge Function. This happens automatically through a database trigger.

## Business ID Mapping

The system maps business IDs between your main application and CRM:

- **Main App Business ID**: `24e2799f-60d5-4e3b-bb30-b8049c9ae56d` (Amici Coffee)
- **CRM Business ID**: `9c38d437-b6c9-425a-9199-d514007fcb63`

## Setup Steps

### 1. Deploy the Database Migration

Run the new migration to create the customer trigger:

```bash
# Navigate to your project directory
cd tablepilotpro

# Apply the new migration
supabase db push
```

This will create:
- `handle_new_customer_to_crm()` function
- `on_new_customer_to_crm` trigger on the `customers` table
- HTTP extension for making API calls

### 2. Deploy the Updated CRM Function

Deploy the updated CRM function with new customer support:

```bash
# Deploy the function to Supabase
supabase functions deploy send-customer-to-crm
```

### 3. Configure Environment Variables

Ensure these environment variables are set in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mxrrvqnfxfigeofbhepv
2. Navigate to Settings → Edge Functions
3. Verify these environment variables are set:

```
CRM_ENDPOINT_URL=https://nnxdtpnrwgcknhpyhowr.supabase.co/rest/v1/customers
CRM_API_KEY=your_crm_api_key_here
```

### 4. Test the Integration

#### Option A: Use the Admin Dashboard Test Button

1. Go to your admin dashboard
2. Look for the "CRM Integration Test" section
3. Click "Test New Customer CRM" button
4. Check the browser console for logs

#### Option B: Manual Database Test

Run the SQL script in your Supabase SQL editor:

```sql
-- See test-customer-trigger.sql for the complete test script
INSERT INTO customers (
    business_id,
    email,
    first_name,
    last_name,
    phone
) VALUES (
    '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
    'test-customer-' || EXTRACT(EPOCH FROM NOW()) || '@example.com',
    'Test',
    'Customer',
    '+44 20 7946 0960'
);
```

## How It Works

### 1. Customer Creation Trigger

When a new customer is inserted into the `customers` table:

```sql
-- Trigger fires automatically
CREATE TRIGGER on_new_customer_to_crm
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_customer_to_crm();
```

### 2. CRM Function Call

The trigger function:
1. Maps the business ID to the CRM business ID
2. Constructs the customer name from first_name and last_name
3. Calls the CRM function with customer data
4. Logs the result

### 3. CRM Data Format

The CRM receives this data structure:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+44 20 7946 0958",
  "booking_date": null,
  "booking_time": null,
  "party_size": null,
  "special_requests": "",
  "source": "tablepilotpro_new_customer",
  "booking_id": null,
  "restaurant_id": null,
  "restaurant_name": null,
  "business_id": "9c38d437-b6c9-425a-9199-d514007fcb63",
  "customer_id": "customer-uuid",
  "external_id": "ext-123",
  "date_of_birth": "1990-01-15",
  "preferences": {"dietary_restrictions": "vegetarian"},
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Customer Creation Scenarios

### 1. Automatic Creation via Booking

When a customer makes a booking:
1. Booking is created in `bookings` table
2. Trigger `on_booking_customer_creation` creates customer record
3. Trigger `on_new_customer_to_crm` sends customer to CRM
4. Original booking trigger sends booking data to CRM

### 2. Manual Customer Creation

When a customer is manually created:
1. Customer record is inserted into `customers` table
2. Trigger `on_new_customer_to_crm` sends customer to CRM

### 3. External System Sync

When syncing from external systems:
1. Use `syncCustomerFromExternal()` function
2. Customer record is created/updated
3. Trigger `on_new_customer_to_crm` sends customer to CRM

## Monitoring and Debugging

### Database Logs

Check Supabase logs for trigger execution:

```sql
-- Check recent customer creations
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;
```

### Function Logs

Check the CRM function logs in Supabase dashboard:
1. Go to Edge Functions → `send-customer-to-crm`
2. View the logs tab
3. Look for entries with `isNewCustomer: true`

### Browser Console

When testing via the admin dashboard, check browser console for:
- `📧 Sending new customer data to CRM:`
- `✅ New customer CRM function response:`
- `❌ New customer CRM test failed:`

## Error Handling

The integration is designed to be non-blocking:

- If the CRM request fails, the customer is still created successfully
- Errors are logged but don't prevent customer creation
- The trigger function has exception handling to prevent failures

## Troubleshooting

### Common Issues

1. **Trigger not firing**
   - Check if the migration was applied: `supabase db push`
   - Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_new_customer_to_crm';`

2. **HTTP extension not available**
   - The migration includes: `CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";`
   - Check if extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'http';`

3. **CRM function not responding**
   - Test the function directly: `supabase functions serve send-customer-to-crm`
   - Check environment variables in Supabase dashboard
   - Verify CRM endpoint is accessible

4. **Business ID mapping issues**
   - Verify the business ID exists in your `businesses` table
   - Check the mapping in the trigger function

### Debug Mode

To enable more detailed logging, you can modify the trigger function:

```sql
-- Add more detailed logging
RAISE NOTICE 'Processing customer: % (email: %) for business: %', 
    v_customer_name, NEW.email, v_business_name;
```

## Security Considerations

1. **API Key Security**: CRM API key is stored securely in Supabase environment variables
2. **HTTPS Only**: All communications use HTTPS
3. **Input Validation**: Customer data is validated before sending
4. **Error Handling**: Failures don't expose sensitive information

## Customization

### Adding More Business Mappings

To add more business ID mappings, edit the trigger function:

```sql
-- In handle_new_customer_to_crm() function
CASE NEW.business_id
    WHEN '24e2799f-60d5-4e3b-bb30-b8049c9ae56d' THEN
        v_crm_business_id := '9c38d437-b6c9-425a-9199-d514007fcb63';
    WHEN 'your-business-id' THEN
        v_crm_business_id := 'your-crm-business-id';
    ELSE
        v_crm_business_id := NULL;
END CASE;
```

### Modifying CRM Data Structure

To change what data is sent to CRM, modify:
1. The trigger function payload in `supabase/migrations/20241203000014_add_customer_to_crm_trigger.sql`
2. The CRM function interface in `supabase/functions/send-customer-to-crm/index.ts`

## Support

If you encounter issues:

1. Check the database logs for trigger execution
2. Review Supabase function logs
3. Test the CRM endpoint independently
4. Verify environment variables are correctly set
5. Check browser console for detailed error messages 