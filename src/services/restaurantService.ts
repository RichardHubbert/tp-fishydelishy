import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Restaurant = TablesInsert<'restaurants'> & { id: string; county?: string | null; is_default?: boolean; category_id?: string | null };
export type RestaurantUpdate = TablesUpdate<'restaurants'>;
export type RestaurantCategory = { id: string; name: string };

export const fetchRestaurantCategories = async (): Promise<RestaurantCategory[]> => {
  const { data, error } = await supabase
    .from('restaurant_categories')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching restaurant categories:', error);
    throw error;
  }

  return data || [];
};

export const createRestaurantCategory = async (name: string): Promise<RestaurantCategory> => {
  const { data, error } = await supabase
    .from('restaurant_categories')
    .insert({ name: name.trim() })
    .select('id, name')
    .single();

  if (error) {
    console.error('Error creating restaurant category:', error);
    throw error;
  }

  return data;
};

export const updateRestaurantCategory = async (id: string, name: string): Promise<RestaurantCategory> => {
  const { data, error } = await supabase
    .from('restaurant_categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select('id, name')
    .single();

  if (error) {
    console.error('Error updating restaurant category:', error);
    throw error;
  }

  const { error: cuisineError } = await supabase
    .from('restaurants')
    .update({ cuisine: name.trim() })
    .eq('category_id', id);

  if (cuisineError) {
    console.error('Error updating restaurant cuisine labels:', cuisineError);
  }

  return data;
};

export const deleteRestaurantCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurant_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting restaurant category:', error);
    throw error;
  }
};

export const uploadRestaurantImage = async (file: File, folder: string): Promise<string> => {
  const extension = file.name.split('.').pop() || 'jpg';
  const filePath = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('restaurants')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading restaurant image:', error);
    throw error;
  }

  const { data } = supabase.storage.from('restaurants').getPublicUrl(filePath);
  return data.publicUrl;
};

export const setDefaultRestaurant = async (id: string): Promise<void> => {
  const { error: clearError } = await supabase
    .from('restaurants')
    .update({ is_default: false })
    .eq('is_default', true);

  if (clearError) {
    console.error('Error clearing default restaurant:', clearError);
    throw clearError;
  }

  const { error } = await supabase
    .from('restaurants')
    .update({ is_default: true })
    .eq('id', id);

  if (error) {
    console.error('Error setting default restaurant:', error);
    throw error;
  }
};

// Fetch all active restaurants
export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }

  return data || [];
};

// Fetch all restaurants (including inactive) - for admin
export const fetchAllRestaurants = async (): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching all restaurants:', error);
    throw error;
  }

  return data || [];
};

// Fetch a single restaurant by ID
export const fetchRestaurantById = async (id: string): Promise<Restaurant | null> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching restaurant:', error);
    throw error;
  }

  return data;
};

// Create a new restaurant
export const createRestaurant = async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant> => {
  if (restaurant.is_default) {
    const { error: clearError } = await supabase
      .from('restaurants')
      .update({ is_default: false })
      .eq('is_default', true);
    if (clearError) throw clearError;
  }

  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();

  if (error) {
    console.error('Error creating restaurant:', error);
    throw error;
  }

  return data;
};

// Update an existing restaurant
export const updateRestaurant = async (id: string, updates: RestaurantUpdate): Promise<Restaurant> => {
  if (updates.is_default) {
    const { error: clearError } = await supabase
      .from('restaurants')
      .update({ is_default: false })
      .eq('is_default', true)
      .neq('id', id);
    if (clearError) throw clearError;
  }

  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating restaurant:', error);
    throw error;
  }

  return data;
};

// Delete a restaurant (soft delete by setting is_active to false)
export const deleteRestaurant = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurants')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting restaurant:', error);
    throw error;
  }
};

// Hard delete a restaurant (permanent removal)
export const hardDeleteRestaurant = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting restaurant:', error);
    throw error;
  }
};

// Restore a deleted restaurant
export const restoreRestaurant = async (id: string): Promise<Restaurant> => {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error restoring restaurant:', error);
    throw error;
  }

  return data;
};

// Search restaurants by name, cuisine, or address
export const searchRestaurants = async (query: string): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .or(`name.ilike.%${query}%,cuisine.ilike.%${query}%,address.ilike.%${query}%`)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching restaurants:', error);
    throw error;
  }

  return data || [];
}; 