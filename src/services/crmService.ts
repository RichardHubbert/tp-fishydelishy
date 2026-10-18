import { supabase } from '@/integrations/supabase/client';

export interface CustomerDataForCRM {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
  restaurantId: string;
  restaurantName?: string;
  bookingDate: string;
  startTime: string;
  partySize: number;
  bookingId: string;
  businessId?: string;
  isNewCustomer?: boolean;
  customerId?: string;
  externalId?: string;
  dateOfBirth?: string;
  preferences?: any;
}

export interface CRMResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  crm_response?: any;
}

/**
 * Send customer booking data to CRM via Supabase function
 */
export const sendCustomerToCRM = async (customerData: CustomerDataForCRM): Promise<CRMResponse> => {
  try {
    console.log('📧 Sending customer data to CRM:', customerData);
    console.log('🏢 Business ID being sent to CRM:', customerData.businessId);

    // Convert to plain object to avoid any proxy issues and ensure all fields are properly formatted
    const plainCustomerData = {
      customerName: customerData.customerName,
      customerEmail: customerData.customerEmail,
      customerPhone: customerData.customerPhone || '',
      specialRequests: customerData.specialRequests || '',
      restaurantId: customerData.restaurantId,
      restaurantName: customerData.restaurantName || '',
      bookingDate: customerData.bookingDate,
      startTime: customerData.startTime,
      partySize: customerData.partySize,
      bookingId: customerData.bookingId,
      businessId: customerData.businessId || '9c38d437-b6c9-425a-9199-d514007fcb63', // Use correct CRM business ID
      isNewCustomer: customerData.isNewCustomer || false,
      customerId: customerData.customerId || ''
    };
    
    console.log('📦 Sending payload:', plainCustomerData);
    
    // Use the correct method to invoke the function with stringified body
    const { data, error } = await supabase.functions.invoke('send-customer-to-crm', {
      body: plainCustomerData
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      return {
        success: false,
        error: 'Failed to send data to CRM',
        details: error.message
      };
    }

    console.log('✅ CRM function response:', data);
    return {
      success: true,
      message: 'Customer data sent to CRM successfully',
      crm_response: data
    };

  } catch (error) {
    console.error('💥 Error calling CRM function:', error);
    return {
      success: false,
      error: 'Failed to send data to CRM',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send new customer data to CRM (without booking)
 */
export const sendNewCustomerToCRM = async (customerData: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessId?: string; // Made optional since we'll use a fixed CRM business ID
  customerId?: string;
  // Removed fields that don't exist in CRM schema
  // externalId?: string;
  // dateOfBirth?: string;
  // preferences?: any;
}): Promise<CRMResponse> => {
  try {
    console.log('📫 Sending new customer data to CRM:', customerData);
    
    // Always use the correct CRM business ID
    const crmBusinessId = '9c38d437-b6c9-425a-9199-d514007fcb63';
    console.log('🏢 Business ID being sent to CRM:', crmBusinessId);

    // Create the payload object with explicit values for all fields
    const payload = {
      customerName: customerData.customerName,
      customerEmail: customerData.customerEmail,
      customerPhone: customerData.customerPhone || '',
      restaurantId: 'new-customer',
      restaurantName: 'New Customer Registration',
      bookingDate: new Date().toISOString().split('T')[0],
      startTime: '00:00',
      partySize: 0,
      bookingId: 'customer-' + (customerData.customerId || Date.now()),
      businessId: crmBusinessId, // Use the correct CRM business ID
      isNewCustomer: true,
      customerId: customerData.customerId || ''
      // Removed fields that don't exist in CRM schema
      // externalId: customerData.externalId,
      // dateOfBirth: customerData.dateOfBirth,
      // preferences: customerData.preferences
    };
    
    console.log('📦 Sending new customer payload:', payload);
    
    // Simplified function invocation without extra headers
    const { data, error } = await supabase.functions.invoke('send-customer-to-crm', {
      body: payload
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      return {
        success: false,
        error: 'Failed to send new customer data to CRM',
        details: error.message
      };
    }

    console.log('✅ New customer CRM function response:', data);
    return {
      success: true,
      message: 'New customer data sent to CRM successfully',
      crm_response: data
    };

  } catch (error) {
    console.error('💥 Error calling CRM function for new customer:', error);
    return {
      success: false,
      error: 'Failed to send new customer data to CRM',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 