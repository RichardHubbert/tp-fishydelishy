# CRM Integration Setup Guide

This guide explains how to set up the CRM integration to send customer booking data from TablePilotPro to your CRM application.

## Overview

When a customer makes a booking in TablePilotPro, the system automatically sends their data to your CRM application via a Supabase Edge Function. This happens automatically after a successful booking is created.

## Customer Data Sent to CRM

The following customer information is sent to your CRM:

```typescript
{
  customer: {
    name: string,           // Full name from booking form
    email: string,          // Email address
    phone: string | null,   // Phone number (optional)
    source: 'tablepilotpro_booking'
  },
  booking: {
    id: string,             // Unique booking ID
    restaurant_id: string,  // Restaurant ID
    restaurant_name: string, // Restaurant name
    date: string,           // Booking date (YYYY-MM-DD)
    time: string,           // Start time (HH:MM)
    party_size: number,     // Number of people
    special_requests: string | null, // Special requests (optional)
    created_at: string      // ISO timestamp
  }
}
```

## Setup Steps

### 1. Deploy the Supabase Function

```bash
# Navigate to your project directory
cd tablepilotpro

# Deploy the function to Supabase
supabase functions deploy send-customer-to-crm
```

### 2. Configure Environment Variables

Set up the following environment variables in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mxrrvqnfxfigeofbhepv
2. Navigate to Settings → Edge Functions
3. Add the following environment variables:

```
CRM_ENDPOINT_URL=https://your-crm-app.com/api/customers
CRM_API_KEY=your_crm_api_key_here
```

**Replace with your actual CRM endpoint and API key.**

### 3. Configure Your CRM Application

Your CRM application needs to accept POST requests at the configured endpoint with the following structure:

**Endpoint:** `POST /api/customers` (or your preferred endpoint)

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 20 7946 0958",
    "source": "tablepilotpro_booking"
  },
  "booking": {
    "id": "uuid-here",
    "restaurant_id": "restaurant-uuid",
    "restaurant_name": "Amici Coffee",
    "date": "2024-01-15",
    "time": "19:00",
    "party_size": 4,
    "special_requests": "Window seat preferred",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "customer_id": "crm-customer-id",
  "booking_id": "crm-booking-id"
}
```

## Testing the Integration

### 1. Test the Function Locally

```bash
# Test the function locally
supabase functions serve send-customer-to-crm

# In another terminal, test with curl
curl -X POST http://localhost:54321/functions/v1/send-customer-to-crm \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+44 20 7946 0958",
    "restaurantId": "test-restaurant-id",
    "bookingDate": "2024-01-15",
    "startTime": "19:00",
    "partySize": 2,
    "bookingId": "test-booking-id"
  }'
```

### 2. Test from Your Application

1. Make a test booking in your TablePilotPro application
2. Check the browser console for CRM integration logs
3. Verify the data appears in your CRM application

## Error Handling

The CRM integration is designed to be non-blocking:

- If the CRM request fails, the booking is still created successfully
- Errors are logged to the console but don't prevent the booking
- You can monitor CRM integration status in the browser console

## Monitoring

### Browser Console Logs

Look for these log messages in the browser console:

- `📧 Sending customer data to CRM...` - Function called
- `✅ Customer data sent to CRM successfully` - Success
- `⚠️ Failed to send customer data to CRM: [error]` - Failure

### Supabase Function Logs

Check function logs in your Supabase dashboard:
1. Go to Edge Functions in your Supabase dashboard
2. Click on `send-customer-to-crm`
3. View the logs tab for detailed error information

## Troubleshooting

### Common Issues

1. **Function not deployed**
   - Run `supabase functions deploy send-customer-to-crm`

2. **Environment variables not set**
   - Check Supabase dashboard → Settings → Edge Functions
   - Verify `CRM_ENDPOINT_URL` and `CRM_API_KEY` are set

3. **CRM endpoint not responding**
   - Test your CRM endpoint directly with curl or Postman
   - Check CRM application logs for errors

4. **CORS issues**
   - Ensure your CRM endpoint allows requests from Supabase
   - Check that your CRM accepts the correct headers

### Debug Mode

To enable more detailed logging, you can modify the function to include additional debug information:

```typescript
// In supabase/functions/send-customer-to-crm/index.ts
console.log('🔍 Debug: CRM endpoint:', CRM_ENDPOINT);
console.log('🔍 Debug: Request payload:', JSON.stringify(crmPayload, null, 2));
```

## Security Considerations

1. **API Key Security**: Store your CRM API key securely in Supabase environment variables
2. **HTTPS Only**: Ensure your CRM endpoint uses HTTPS
3. **Input Validation**: The function validates required fields before sending
4. **Rate Limiting**: Consider implementing rate limiting in your CRM application

## Customization

You can customize the data structure sent to your CRM by modifying:

1. **Function payload** (`supabase/functions/send-customer-to-crm/index.ts`)
2. **Service interface** (`src/services/crmService.ts`)
3. **Booking service integration** (`src/services/supabaseBookingService.ts`)

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review Supabase function logs
3. Test your CRM endpoint independently
4. Verify environment variables are correctly set 