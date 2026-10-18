// Test script for CRM function
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and service role key
const supabaseUrl = 'https://mxrrvqnfxfigeofbhepv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCrmFunction() {
  console.log('Testing CRM function...');
  
  const testData = {
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "555-1234",
    specialRequests: "Test request",
    restaurantId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",
    bookingDate: "2025-07-15",
    startTime: "18:00",
    partySize: 2,
    bookingId: "test-booking-123",
    businessId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d"
  };
  
  console.log('Test data:', JSON.stringify(testData, null, 2));
  
  try {
    // Method 1: Using supabase.functions.invoke
    console.log('\n--- Testing with supabase.functions.invoke ---');
    const { data: data1, error: error1 } = await supabase.functions.invoke('send-customer-to-crm', {
      body: testData
    });
    
    if (error1) {
      console.error('Error with invoke method:', error1);
    } else {
      console.log('Success with invoke method:', data1);
    }
    
    // Method 2: Using fetch directly
    console.log('\n--- Testing with direct fetch ---');
    const response = await fetch(`${supabaseUrl}/functions/v1/send-customer-to-crm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(testData)
    });
    
    const responseData = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', responseData);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCrmFunction().catch(console.error);
