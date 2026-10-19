import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, isSameDay } from 'date-fns';
import { sendCustomerToCRM } from './crmService';
import { siteConfig } from '@/config/site';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  section: string;
}

export interface Booking {
  id: string;
  table_id: string;
  restaurant_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  special_requests?: string;
  created_at: string;
  restaurant?: {
    id: string;
    name: string;
    cuisine: string;
    address?: string;
    phone?: string | null;
    email?: string | null;
  };
}

// Fetch all tables from Supabase
export const fetchTables = async (): Promise<Table[]> => {
  console.log('Fetching tables from Supabase...');
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
  
  console.log('Tables fetched successfully:', data);
  return data || [];
};

// Fetch bookings for a specific date
export const fetchBookingsForDate = async (date: Date): Promise<Booking[]> => {
  const dateString = format(date, 'yyyy-MM-dd');
  console.log('Fetching bookings for date:', dateString);
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_date', dateString)
    .eq('status', 'confirmed');
  
  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
  
  console.log('Bookings fetched for date:', dateString, data);
  // Cast the data to ensure proper typing for status field
  return (data || []).map(booking => ({
    ...booking,
    status: booking.status as 'confirmed' | 'cancelled' | 'completed'
  }));
};

// Generate time slots from config opening hours
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  // Parse opening hours from config - "Daily: 9:00 AM - 11:00 PM"
  const startHour = 9; // 9 AM
  const lastBookingTime = siteConfig.hours.lastBooking; // "10:00 PM"
  const [lastHour, lastMinute] = lastBookingTime.split(':').map(s => {
    const num = parseInt(s.replace(/[^0-9]/g, ''));
    return s.includes('PM') && num !== 12 ? num + 12 : num;
  });
  
  // Default to 22:00 (10 PM) if parsing fails
  const endHour = lastHour || 22;
  const endMinute = lastMinute || 0;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === endHour && minute > endMinute) break;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

// Check if a time slot overlaps with existing bookings
const hasTimeConflict = (
  startTime: string,
  endTime: string,
  existingBookings: Booking[]
): boolean => {
  return existingBookings.some(booking => {
    // Convert times to minutes for easier comparison
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const newStart = parseTime(startTime);
    const newEnd = parseTime(endTime);
    const existingStart = parseTime(booking.start_time);
    const existingEnd = parseTime(booking.end_time);
    
    // Check for overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

// Get available time slots for a specific date and party size
export const getAvailableTimeSlots = async (
  date: Date,
  partySize: number
): Promise<{time: string, available: boolean, tableSize?: number}[]> => {
  const timeSlots = generateTimeSlots();
  const tables = await fetchTables();
  const bookings = await fetchBookingsForDate(date);
  
  const suitableTables = tables.filter(table => table.capacity >= partySize);
  
  return timeSlots.map(timeSlot => {
    // Calculate end time (2.5 hours later)
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, 150); // 2.5 hours
    const endTime = format(endDate, 'HH:mm');
    
    // Check if any suitable table is available
    let availableTable = null;
    
    for (const table of suitableTables) {
      const tableBookings = bookings.filter(booking => booking.table_id === table.id);
      
      if (!hasTimeConflict(timeSlot, endTime, tableBookings)) {
        availableTable = table;
        break;
      }
    }
    
    return {
      time: timeSlot,
      available: !!availableTable,
      tableSize: availableTable?.capacity
    };
  });
};

// Get the optimal table for a party size (prefer exact match)
export const getOptimalTable = async (partySize: number): Promise<Table | null> => {
  const tables = await fetchTables();
  const suitableTables = tables.filter(table => table.capacity >= partySize);
  
  if (suitableTables.length === 0) return null;
  
  // Sort by capacity to prefer smaller tables that still fit the party
  suitableTables.sort((a, b) => a.capacity - b.capacity);
  
  return suitableTables[0];
};

// Create a new booking
export const createBooking = async (bookingData: {
  restaurantId: string;
  date: Date;
  startTime: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
}): Promise<Booking> => {
  console.log('🚀 Starting booking creation process...');
  console.log('📊 Booking data received:', {
    ...bookingData,
    date: bookingData.date.toISOString()
  });
  
  try {
    // Test Supabase connection first
    console.log('🔌 Testing Supabase connection...');
    const connectionTest = await supabase.from('tables').select('count', { count: 'exact', head: true });
    console.log('✅ Supabase connection test result:', connectionTest);
    
    if (connectionTest.error) {
      console.error('❌ Supabase connection failed:', connectionTest.error);
      throw new Error(`Database connection failed: ${connectionTest.error.message}`);
    }
    
    console.log('🔍 Finding optimal table...');
    const optimalTable = await getOptimalTable(bookingData.partySize);
    
    if (!optimalTable) {
      console.error('❌ No suitable table found for party size:', bookingData.partySize);
      throw new Error('No suitable table available');
    }
    
    // Calculate end time (2.5 hours after start time)
    const [hours, minutes] = bookingData.startTime.split(':').map(Number);
    const startDate = new Date(bookingData.date);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, 150); // 2.5 hours
    const endTime = format(endDate, 'HH:mm');
    
    // Insert booking into Supabase
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        table_id: optimalTable.id,
        restaurant_id: bookingData.restaurantId,
        business_id: siteConfig.ids.businessId,
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        booking_date: format(bookingData.date, 'yyyy-MM-dd'),
        start_time: bookingData.startTime,
        end_time: endTime,
        party_size: bookingData.partySize,
        status: 'confirmed',
        special_requests: bookingData.specialRequests
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error inserting booking:', error);
      throw error;
    }
    
    console.log('✅ Booking created successfully:', data);
    
    // Send customer data to CRM (fire and forget - don't block booking creation)
    try {
      console.log('📧 Sending customer data to CRM...');
      console.log('🏢 Business ID from booking data:', data.business_id);
      // Use the correct CRM business ID - this is different from the booking platform business ID
      // The CRM edge function will map restaurant IDs to CRM business IDs
      const crmBusinessId = '9c38d437-b6c9-425a-9199-d514007fcb63'; // This is the CRM business ID
      
      const crmResult = await sendCustomerToCRM({
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        specialRequests: bookingData.specialRequests,
        restaurantId: bookingData.restaurantId,
        bookingDate: format(bookingData.date, 'yyyy-MM-dd'),
        startTime: bookingData.startTime,
        partySize: bookingData.partySize,
        bookingId: data.id,
        businessId: crmBusinessId // Use the correct CRM business ID
      });
      
      if (crmResult.success) {
        console.log('✅ Customer data sent to CRM successfully');
      } else {
        console.warn('⚠️ Failed to send customer data to CRM:', crmResult.error);
      }
    } catch (crmError) {
      console.warn('⚠️ Error sending customer data to CRM:', crmError);
      // Don't throw error - booking was successful, CRM sync is secondary
    }
    
    return data as Booking;
  } catch (error) {
    console.error('💥 Booking creation failed:', error);
    throw error;
  }
};

// Fetch all bookings with restaurant info (for admin dashboard)
export const fetchAllBookings = async (): Promise<Booking[]> => {
  console.log('Fetching all bookings from Supabase...');
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, restaurant:restaurant_id (id, name, cuisine)`)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching all bookings:', error);
    throw error;
  }

  console.log('All bookings fetched:', data);
  // Cast the data to ensure proper typing for status field
  return (data || []).map(booking => ({
    ...booking,
    status: booking.status as 'confirmed' | 'cancelled' | 'completed',
    restaurant: booking.restaurant && typeof booking.restaurant === 'object' && 'id' in (booking.restaurant as any)
      ? booking.restaurant as { id: string; name: string; cuisine: string }
      : undefined
  }));
};

// Get next reservation for a specific table
export const getNextReservationForTable = (tableId: string, allBookings: Booking[]): Booking | null => {
  const now = new Date();
  const currentDate = format(now, 'yyyy-MM-dd');
  const currentTime = format(now, 'HH:mm');
  
  // Filter bookings for this table that are today or in the future
  const futureBookings = allBookings
    .filter(booking => booking.table_id === tableId)
    .filter(booking => {
      const bookingDate = booking.booking_date;
      // Include today's bookings that haven't started yet, or future dates
      return bookingDate > currentDate || 
             (bookingDate === currentDate && booking.start_time > currentTime);
    })
    .sort((a, b) => {
      // Sort by date first, then by time
      if (a.booking_date !== b.booking_date) {
        return a.booking_date.localeCompare(b.booking_date);
      }
      return a.start_time.localeCompare(b.start_time);
    });
  
  return futureBookings.length > 0 ? futureBookings[0] : null;
};

// Delete a booking by ID
export const deleteBooking = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};

// Update a booking by ID
export const updateBooking = async (id: string, updates: Partial<Booking>): Promise<Booking> => {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
  return data as Booking;
};
