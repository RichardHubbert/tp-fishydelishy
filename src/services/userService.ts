import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { siteConfig } from '@/config/site';

export type User = TablesInsert<'profiles'> & { id: string };
export type UserUpdate = TablesUpdate<'profiles'>;

export type UserRole = 'admin' | 'business' | 'user';

// Fetch all users (admin only)
export const fetchAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data || [];
};

// Fetch a single user by ID
export const fetchUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }

  return data;
};

// Create a new user profile
export const createUserProfile = async (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(user)
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
};

// Update an existing user
export const updateUser = async (id: string, updates: UserUpdate): Promise<User> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  return data;
};

// Delete a user (soft delete by setting role to inactive)
export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'inactive' })
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Hard delete a user (permanent removal)
export const hardDeleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting user:', error);
    throw error;
  }
};

// Restore a deleted user
export const restoreUser = async (id: string): Promise<User> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error restoring user:', error);
    throw error;
  }

  return data;
};

// Search users by name, email, or role
export const searchUsers = async (query: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,company_name.ilike.%${query}%,role.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }

  return data || [];
};

// Get user count by role
export const getUserCountByRole = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role');

  if (error) {
    console.error('Error getting user count by role:', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  data?.forEach(user => {
    counts[user.role] = (counts[user.role] || 0) + 1;
  });

  return counts;
};

// Invite a new user (create auth user and profile)
export const inviteUser = async (email: string, role: UserRole, fullName?: string, companyName?: string): Promise<User> => {
  // First, create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: 'temp-password-123', // User will need to reset this
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      company_name: companyName,
      role: role
    }
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('Failed to create auth user');
  }

  // Then create the profile
  const profileData = {
    user_id: authData.user.id,
    full_name: fullName || '',
    company_name: companyName || '',
    role: role
  };

  return await createUserProfile(profileData);
};

// Get all bookings for configured restaurant (for customer analysis)
export const getAmiciCoffeeBookings = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('restaurant_id', siteConfig.ids.restaurantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return data || [];
};

// Get customer booking history
export const getCustomerHistory = async (customerEmail: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_email', customerEmail)
    .eq('restaurant_id', siteConfig.ids.restaurantId)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching customer history:', error);
    throw error;
  }

  return data || [];
};

// Get unique customers for configured restaurant
export const getAmiciCoffeeCustomers = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('customer_email, customer_name, customer_phone')
    .eq('restaurant_id', siteConfig.ids.restaurantId)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }

  // Remove duplicates and return unique customers
  const uniqueCustomers = data?.filter((customer, index, self) => 
    index === self.findIndex(c => c.customer_email === customer.customer_email)
  ) || [];

  return uniqueCustomers;
}; 