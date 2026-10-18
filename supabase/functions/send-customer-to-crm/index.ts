// @ts-nocheck
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface CustomerData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  specialRequests?: string
  restaurantId: string
  restaurantName?: string
  bookingDate: string
  startTime: string
  partySize: number
  bookingId: string
  businessId?: string
  isNewCustomer?: boolean
  customerId?: string
  externalId?: string
  dateOfBirth?: string
  preferences?: any
}

// Map restaurant IDs to CRM business IDs
const restaurantToBusinessMap: Record<string, string> = {
  '24e2799f-60d5-4e3b-bb30-b8049c9ae56d': '9c38d437-b6c9-425a-9199-d514007fcb63',
  // Add more mappings as needed
};

// Default business ID to use if none is provided or mapped
const DEFAULT_BUSINESS_ID = '9c38d437-b6c9-425a-9199-d514007fcb63';

serve(async (req: Request) => {
  try {
    console.log('==================================================');
    console.log('🚀 Function started at:', new Date().toISOString());
    console.log('🚀 Request method:', req.method);
    console.log('🚀 Request URL:', req.url);
    console.log('🚀 Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Log the raw request body for debugging
  try {
    const rawBody = await req.text();
    console.log('📣 Raw request body:', rawBody);
    
    // Try to parse the body back to JSON for processing
    try {
      const jsonBody = JSON.parse(rawBody);
      req = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(jsonBody)
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body as JSON:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } catch (bodyReadError) {
    console.error('❌ Failed to read request body:', bodyReadError);
  }

  // Add a schema check endpoint
  const url = new URL(req.url)
  if (url.pathname.includes('/schema')) {
    const CRM_API_KEY = Deno.env.get('CRM_API_KEY')
    const CRM_ENDPOINT = Deno.env.get('CRM_ENDPOINT_URL') || 'https://nnxdtpnrwgcknhpyhowr.supabase.co/rest/v1/customers'
    
    try {
      // Try to get the table schema by making a request with specific headers
      const response = await fetch(CRM_ENDPOINT, {
        method: 'GET',
        headers: {
          'apikey': CRM_API_KEY || '',
          'Authorization': `Bearer ${CRM_API_KEY || ''}`,
          'Accept': 'application/json',
          'Range': '0-0'
        }
      })
      
      const responseText = await response.text()
      
      return new Response(
        JSON.stringify({
          schema_check: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            response: responseText,
            endpoint: CRM_ENDPOINT
          }
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({
          schema_check: {
            error: error.message,
            endpoint: CRM_ENDPOINT
          }
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }
  }

  // Add a test endpoint for debugging
  if (url.pathname.includes('/test')) {
    const CRM_API_KEY = Deno.env.get('CRM_API_KEY')
    const CRM_ENDPOINT = Deno.env.get('CRM_ENDPOINT_URL') || 'https://nnxdtpnrwgcknhpyhowr.supabase.co/rest/v1/customers'
    
    // Check if this is a POST request to test permissions
    if (req.method === 'POST') {
      try {
        console.log('🧪 Running business_id permission test')
        
        // Create a test payload with a specific business_id
        const testBusinessId = DEFAULT_BUSINESS_ID
        const testPayload = {
          name: 'Test Permission User', // Required field
          first_name: 'Test',
          last_name: 'Permission User',
          email: `test-${Date.now()}@example.com`, // Unique email to avoid conflicts
          phone: '555-1234',
          business_id: testBusinessId,
          total_bookings: 0,
          total_spent: 0
          // Removed external_id as it doesn't exist in the CRM schema
        }
        
        console.log('🧪 Test payload:', JSON.stringify(testPayload, null, 2))
        
        // Send test request with return=representation to see what's stored
        // Removed on_conflict parameter since we don't know the exact unique constraint
        const testResponse = await fetch(`${CRM_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': CRM_API_KEY,
            'Authorization': `Bearer ${CRM_API_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(testPayload)
        })
        
        const testResponseStatus = testResponse.status
        const testResponseText = await testResponse.text()
        let parsedTestResponse = null
        let businessIdReceived = null
        
        try {
          if (testResponseText) {
            parsedTestResponse = JSON.parse(testResponseText)
            if (Array.isArray(parsedTestResponse) && parsedTestResponse.length > 0) {
              businessIdReceived = parsedTestResponse[0].business_id
            } else if (parsedTestResponse && typeof parsedTestResponse === 'object') {
              businessIdReceived = parsedTestResponse.business_id
            }
          }
        } catch (parseError) {
          console.error('🧪 Failed to parse test response:', parseError.message)
        }
        
        // Check if business_id was preserved
        const businessIdMatch = testBusinessId === businessIdReceived
        
        return new Response(
          JSON.stringify({
            test_type: 'business_id_permission_test',
            test_status: testResponse.ok ? 'success' : 'failed',
            response_status: testResponseStatus,
            business_id_sent: testBusinessId,
            business_id_received: businessIdReceived,
            business_id_preserved: businessIdMatch,
            permission_issue: !businessIdMatch,
            raw_response: testResponseText,
            parsed_response: parsedTestResponse,
            test_payload: testPayload
          }),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({
            test_type: 'business_id_permission_test',
            test_status: 'error',
            error: error.message
          }),
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }
    }
    
    // Default GET request - Test the connection and get table info
    try {
      const response = await fetch(CRM_ENDPOINT, {
        method: 'GET',
        headers: {
          'apikey': CRM_API_KEY || '',
          'Authorization': `Bearer ${CRM_API_KEY || ''}`,
          'Range': '0-0' // Just get one row to see the structure
        }
      })
      
      const tableInfo = await response.text()
      
      return new Response(
        JSON.stringify({
          env_check: {
            crm_api_key_present: !!CRM_API_KEY,
            crm_endpoint: CRM_ENDPOINT,
            crm_api_key_length: CRM_API_KEY ? CRM_API_KEY.length : 0
          },
          table_response: tableInfo,
          test_connection: 'Use POST to test business_id permissions'
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({
          env_check: {
            crm_api_key_present: !!CRM_API_KEY,
            crm_endpoint: CRM_ENDPOINT,
            crm_api_key_length: CRM_API_KEY ? CRM_API_KEY.length : 0
          },
          error: error.message,
          test_connection: 'Use POST to test actual connection'
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }
  }

  try {
    console.log('📝 Parsing request body...')
    console.log('📝 Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Parse the request body
    let customerData: CustomerData
    let rawBody = ''
    try {
      // First get the raw body for logging
      rawBody = await req.text()
      console.log('📄 Raw request body:', rawBody)
      
      // Check if body is empty
      if (!rawBody || rawBody.trim() === '') {
        console.error('❌ Empty request body received')
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body', 
            message: 'Please provide customer data in the request body'
          }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      }
      
      // Then parse it as JSON
      customerData = JSON.parse(rawBody)
      console.log('✅ Request body parsed successfully:', customerData)
      
      // Check for required fields
      if (!customerData.customerName && !customerData.customerEmail) {
        console.error('❌ Missing required fields in request')
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields', 
            message: 'customerName or customerEmail is required'
          }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      }
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      console.error('❌ Raw body received:', rawBody)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: parseError.message,
          raw_body: rawBody
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    // Validate required fields
    const isNewCustomer = customerData.isNewCustomer === true;
    const requiredFields = isNewCustomer 
      ? ['customerName', 'customerEmail'] 
      : ['customerName', 'customerEmail', 'restaurantId'];
    
    const missingFields = requiredFields.filter(field => !customerData[field as keyof CustomerData]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', { 
        isNewCustomer,
        missingFields,
        hasName: !!customerData.customerName, 
        hasEmail: !!customerData.customerEmail, 
        hasRestaurantId: !!customerData.restaurantId 
      })
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          isNewCustomer 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Get your CRM endpoint URL from environment variables
    const CRM_ENDPOINT = Deno.env.get('CRM_ENDPOINT_URL') || 'https://nnxdtpnrwgcknhpyhowr.supabase.co/rest/v1/customers'
    const CRM_API_KEY = Deno.env.get('CRM_API_KEY')

    console.log('🔍 CRM endpoint:', CRM_ENDPOINT)
    console.log('🔑 CRM API key present:', !!CRM_API_KEY)

    if (!CRM_API_KEY) {
      console.error('❌ CRM_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: 'CRM API key not configured' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Set business_id based on restaurant_id
    let crmBusinessId: string | null = null;
    
    // First try to get from explicit businessId in the request
    if (customerData.businessId) {
      crmBusinessId = customerData.businessId;
      console.log('DEBUG: Using explicit businessId from request:', crmBusinessId);
    } 
    // Then try to map from restaurantId
    else if (customerData.restaurantId && restaurantToBusinessMap[customerData.restaurantId]) {
      crmBusinessId = restaurantToBusinessMap[customerData.restaurantId];
      console.log('DEBUG: Mapped businessId from restaurantId:', crmBusinessId);
    } 
    // Finally use default if nothing else works
    else {
      crmBusinessId = DEFAULT_BUSINESS_ID;
      console.log('DEBUG: Using DEFAULT_BUSINESS_ID:', crmBusinessId);
    }
    
    console.log('DEBUG: restaurantId:', customerData.restaurantId);
    console.log('DEBUG: Final crmBusinessId to be used:', crmBusinessId);

    // Determine if this is a new customer or a booking
    const source = isNewCustomer ? 'tablepilotpro_new_customer' : 'tablepilotpro_booking';

    // Build CRM payload, always include business_id
    // Parse customer name into first and last name or use as full name depending on CRM schema
    let firstName = '';
    let lastName = '';
    let fullName = '';
    // Parse customer name into first and last name
    if (customerData.customerName) {
      fullName = customerData.customerName.trim();
      const nameParts = fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const crmPayload = {
      // Required fields - name is required in the CRM schema
      name: customerData.customerName || `${firstName} ${lastName}`.trim(), 
      email: customerData.customerEmail,
      phone: customerData.customerPhone || '',
      business_id: crmBusinessId || DEFAULT_BUSINESS_ID,
      
      // Additional fields that exist in the CRM schema
      first_name: firstName || null,
      last_name: lastName || null,
      total_bookings: typeof customerData.totalBookings === 'number' ? customerData.totalBookings : 0,
      total_spent: typeof customerData.totalSpent === 'number' ? customerData.totalSpent : 0,
      last_booking_date: customerData.bookingDate || null,
      
      // All non-standard fields have been removed as they don't exist in the CRM schema
      // Removed: external_id, date_of_birth, preferences
    };

    // Log the full payload for verification
    console.log('DEBUG: Final CRM payload:', JSON.stringify(crmPayload, null, 2));

    console.log('🚀 Sending to CRM payload:', JSON.stringify(crmPayload, null, 2))
    console.log('🔗 CRM endpoint:', CRM_ENDPOINT)
    console.log('🔑 API key length:', CRM_API_KEY ? CRM_API_KEY.length : 0)
    console.log('🏢 Business ID being sent:', crmPayload.business_id)
    
    // Validate business_id before sending
    if (!crmPayload.business_id) {
      console.error('❌ No business_id available, using DEFAULT_BUSINESS_ID')
      crmPayload.business_id = DEFAULT_BUSINESS_ID
    }

    // Send data to CRM using standard POST operation
    // Removed on_conflict parameter since we don't know the exact unique constraint
    console.log('📤 Sending request to CRM:', CRM_ENDPOINT);
    console.log('📤 CRM payload:', JSON.stringify(crmPayload, null, 2));
    console.log('📤 CRM API key length:', CRM_API_KEY ? CRM_API_KEY.length : 0);
    
    let crmResponse;
    try {
      crmResponse = await fetch(`${CRM_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CRM_API_KEY,
          'Authorization': `Bearer ${CRM_API_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(crmPayload)
      });
      
      console.log('📥 CRM response status:', crmResponse.status);
      console.log('📥 CRM response headers:', Object.fromEntries(crmResponse.headers.entries()));
    } catch (fetchError) {
      console.error('❌ Error making CRM request:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error making CRM request', 
          details: fetchError.message,
          endpoint: CRM_ENDPOINT
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    console.log('📡 CRM response status:', crmResponse.status)
    console.log('📡 CRM response headers:', Object.fromEntries(crmResponse.headers.entries()))

    if (!crmResponse.ok) {
      const errorText = await crmResponse.text()
      console.error('❌ CRM request failed:', crmResponse.status, errorText)
      console.error('❌ CRM request headers:', Object.fromEntries(crmResponse.headers.entries()))
      console.error('❌ CRM request payload:', JSON.stringify(crmPayload, null, 2))
      
      let parsedError = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        console.error('❌ Could not parse error response as JSON');
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'CRM request failed', 
          status: crmResponse.status,
          details: errorText,
          parsed_error: parsedError,
          endpoint: CRM_ENDPOINT,
          payload: crmPayload,
          business_id_sent: crmPayload.business_id
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    // Try to get the response body with detailed representation
    let responseBody = ''
    let parsedResponse = null
    try {
      responseBody = await crmResponse.text()
      console.log('📡 CRM response body:', responseBody)
      
      // Try to parse the response as JSON to analyze fields
      if (responseBody) {
        try {
          parsedResponse = JSON.parse(responseBody)
          console.log('📡 CRM response parsed successfully')
          
          // Check specifically for business_id in the response
          if (parsedResponse) {
            if (Array.isArray(parsedResponse)) {
              // If response is an array (common with return=representation)
              console.log('📡 CRM returned array response, checking first item')
              if (parsedResponse.length > 0) {
                console.log('📡 CRM response business_id:', parsedResponse[0].business_id)
                if (!parsedResponse[0].business_id) {
                  console.error('❌ business_id is null/undefined in CRM response despite being sent as:', crmPayload.business_id)
                }
              }
            } else {
              // If response is a single object
              console.log('📡 CRM response business_id:', parsedResponse.business_id)
              if (!parsedResponse.business_id) {
                console.error('❌ business_id is null/undefined in CRM response despite being sent as:', crmPayload.business_id)
              }
            }
          }
        } catch (parseError) {
          console.log('📡 CRM response is not valid JSON:', parseError.message)
        }
      }
    } catch (parseError) {
      console.log('📡 CRM response is not valid JSON:', parseError.message)
    }
    
    console.log('✅ CRM request successful')
    console.log('🏢 Business ID being sent:', crmPayload.business_id)

    return new Response(
      JSON.stringify({
        success: true,
        message: isNewCustomer ? 'New customer data sent to CRM successfully' : 'Customer booking data sent to CRM successfully',
        crm_status: crmResponse.status,
        crm_response: responseBody,
        crm_parsed_response: parsedResponse,
        sent_data: crmPayload,
        business_id_sent: crmPayload.business_id,
        business_id_received: parsedResponse ? 
          (Array.isArray(parsedResponse) && parsedResponse.length > 0 ? parsedResponse[0].business_id : parsedResponse?.business_id) : 
          null,
        isNewCustomer
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('💥 Error in send-customer-to-crm function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send customer data to CRM',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
  } catch (globalError) {
    console.error('❌ UNHANDLED ERROR IN FUNCTION:', globalError);
    return new Response(
      JSON.stringify({
        error: 'Unhandled error in function',
        message: globalError.message,
        stack: globalError.stack
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
})

/* To invoke locally:

  1. Run `supabase start` 
  2. Run `supabase functions serve send-customer-to-crm --no-verify-jwt`
  3. Make HTTP request:
     curl -i --location --request POST 'http://localhost:54321/functions/v1/send-customer-to-crm' \
     --header 'Content-Type: application/json' \
     --data '{}'
*/