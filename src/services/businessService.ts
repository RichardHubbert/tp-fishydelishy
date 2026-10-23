import { supabase } from '@/integrations/supabase/client';

export interface Business {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  external_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  preferences?: any;
  total_bookings: number;
  total_spent: number;
  last_booking_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAnalytics {
  business_id: string;
  business_name: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  total_bookings: number;
  first_booking?: string;
  last_booking?: string;
  total_guests: number;
  avg_party_size: number;
  completed_bookings: number;
  cancelled_bookings: number;
}

// Get current business from URL or context
export const getCurrentBusiness = (): string => {
  // For now, hardcode to Amici Coffee
  // In production, this would be determined by domain or subdomain
  return 'amicicoffee';
};

// Fetch all businesses (admin only)
export const fetchAllBusinesses = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }

  return data || [];
};

// Fetch business by slug
export const fetchBusinessBySlug = async (slug: string): Promise<Business | null> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    throw error;
  }

  return data;
};

// Fetch customers for a specific business (with fallback)
export const fetchBusinessCustomers = async (businessSlug: string): Promise<Customer[]> => {
  try {
    // Try the RPC function first (requires businesses table)
    const { data, error } = await supabase
      .rpc('get_business_customers', { business_slug: businessSlug });

    if (error) {
      console.warn('RPC function failed, trying fallback method:', error);
      // Fallback: fetch customers directly from bookings table
      return await fetchCustomersFallback();
    }

    // Transform RPC result to match Customer interface
    return (data || []).map(customer => ({
      id: customer.customer_id,
      business_id: '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      total_bookings: customer.total_bookings,
      total_spent: 0, // Default value
      last_booking_date: customer.last_booking_date,
      created_at: customer.created_at,
      updated_at: customer.created_at // Use created_at as fallback
    }));
  } catch (error) {
    console.error('Error fetching business customers:', error);
    // Fallback: fetch customers directly from bookings table
    return await fetchCustomersFallback();
  }
};

// Fallback function to fetch customers from bookings table
const fetchCustomersFallback = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('customer_email, customer_name, customer_phone, booking_date, party_size')
      .eq('business_id', '24e2799f-60d5-4e3b-bb30-b8049c9ae56d') // Amici Coffee
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Error in fallback customer fetch:', error);
      throw error;
    }

    // Group by customer email and create customer objects
    const customerMap = new Map<string, any>();
    
    data?.forEach(booking => {
      if (!customerMap.has(booking.customer_email)) {
        const [firstName, ...lastNameParts] = (booking.customer_name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        
        customerMap.set(booking.customer_email, {
          id: `fallback-${booking.customer_email}`,
          business_id: '24e2799f-60d5-4e3b-bb30-b8049c9ae56d',
          email: booking.customer_email,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          phone: booking.customer_phone,
          total_bookings: 1,
          total_spent: 0,
          last_booking_date: booking.booking_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        // Increment booking count for existing customer
        const customer = customerMap.get(booking.customer_email);
        customer.total_bookings += 1;
        if (booking.booking_date > customer.last_booking_date) {
          customer.last_booking_date = booking.booking_date;
        }
      }
    });

    return Array.from(customerMap.values());
  } catch (error) {
    console.error('Error in fallback customer fetch:', error);
    return [];
  }
};

// Fetch customer analytics for a business
export const fetchCustomerAnalytics = async (businessSlug: string): Promise<CustomerAnalytics[]> => {
  const { data, error } = await supabase
    .from('business_customer_analytics')
    .select('*')
    .eq('business_id', (await fetchBusinessBySlug(businessSlug))?.id);

  if (error) {
    console.error('Error fetching customer analytics:', error);
    throw error;
  }

  return data || [];
};

// Sync customer from external system
export const syncCustomerFromExternal = async (
  businessSlug: string,
  externalId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  dateOfBirth?: string,
  preferences?: any
): Promise<string> => {
  const { data, error } = await supabase
    .rpc('sync_customer_from_external', {
      p_business_slug: businessSlug,
      p_external_id: externalId,
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: phone,
      p_date_of_birth: dateOfBirth,
      p_preferences: preferences
    });

  if (error) {
    console.error('Error syncing customer:', error);
    throw error;
  }

  return data;
};

// Create a new customer
export const createCustomer = async (customerData: {
  businessSlug: string;
  externalId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: any;
}): Promise<Customer> => {
  const business = await fetchBusinessBySlug(customerData.businessSlug);
  if (!business) {
    throw new Error('Business not found');
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: business.id,
      external_id: customerData.externalId,
      email: customerData.email,
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      phone: customerData.phone,
      date_of_birth: customerData.dateOfBirth,
      preferences: customerData.preferences
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }

  return data;
};

// Update customer
export const updateCustomer = async (
  customerId: string,
  updates: Partial<Customer>
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }

  return data;
};

// Delete customer
export const deleteCustomer = async (customerId: string): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Get customer by email for a specific business
export const getCustomerByEmail = async (businessSlug: string, email: string): Promise<Customer | null> => {
  const business = await fetchBusinessBySlug(businessSlug);
  if (!business) {
    throw new Error('Business not found');
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching customer:', error);
    throw error;
  }

  return data;
};

// Get customer booking history
export const getCustomerBookingHistory = async (
  businessSlug: string,
  customerEmail: string
): Promise<any[]> => {
  const business = await fetchBusinessBySlug(businessSlug);
  if (!business) {
    throw new Error('Business not found');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('business_id', business.id)
    .eq('customer_email', customerEmail)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching customer booking history:', error);
    throw error;
  }

  return data || [];
};

// Create a new business
export const createBusiness = async (businessData: {
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}): Promise<Business> => {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      name: businessData.name,
      slug: businessData.slug,
      domain: businessData.domain,
      logo_url: businessData.logoUrl,
      primary_color: businessData.primaryColor,
      secondary_color: businessData.secondaryColor,
      contact_email: businessData.contactEmail,
      contact_phone: businessData.contactPhone,
      address: businessData.address
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business:', error);
    throw error;
  }

  return data;
};

// Update business
export const updateBusiness = async (
  businessId: string,
  updates: Partial<Business>
): Promise<Business> => {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business:', error);
    throw error;
  }

  return data;
};

// Delete business (soft delete by setting is_active to false)
export const deactivateBusiness = async (businessId: string): Promise<void> => {
  const { error } = await supabase
    .from('businesses')
    .update({ is_active: false })
    .eq('id', businessId);

  if (error) {
    console.error('Error deactivating business:', error);
    throw error;
  }
}; 