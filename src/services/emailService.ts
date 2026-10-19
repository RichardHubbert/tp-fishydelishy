import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  start_time: string;
  party_size: number;
  special_requests?: string;
  restaurant_id?: string;
  restaurant?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Send booking confirmation email via Supabase edge function using Resend
 * Uses "Table Pilot" as sender and includes restaurant details from DB
 */
export const sendBookingConfirmationEmail = async (booking: Booking): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending booking confirmation email via Supabase edge function...');
    
    // Format booking date/time
    const bookingDateTime = `${format(new Date(booking.booking_date), 'EEEE, MMMM do, yyyy')} at ${booking.start_time}`;
    
    // Prepare email payload
    const emailPayload = {
      to_name: booking.customer_name,
      to_email: booking.customer_email,
      booking_id: booking.id,
      booking_date_time: bookingDateTime,
      party_size: booking.party_size,
      special_requests: booking.special_requests || 'None',
      restaurant_name: booking.restaurant?.name || 'Table Pilot',
      restaurant_address: booking.restaurant?.address || '',
      restaurant_phone: booking.restaurant?.phone || '',
      restaurant_email: booking.restaurant?.email || '',
    };
    
    console.log('📧 Email payload:', emailPayload);
    
    // Call Supabase edge function
    const { data, error } = await supabase.functions.invoke('send-booking-email', {
      body: emailPayload,
    });
    
    if (error) {
      console.error('❌ Error from edge function:', error);
      return {
        success: false,
        error: 'Unable to send confirmation email. Your booking is confirmed, but the email failed to send.'
      };
    }
    
    console.log('✅ Email sent successfully:', data);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email:', error);
    return {
      success: false,
      error: 'Unable to send confirmation email. Your booking is confirmed, but the email failed to send.'
    };
  }
};

/**
 * Test email service - sends a test email to verify configuration
 */
export const testEmailService = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🧪 Testing email service via Supabase edge function...');
    
    const testPayload = {
      to_name: 'Test User',
      to_email: 'richardhubbert@gmail.com',
      booking_id: 'TEST-' + Date.now(),
      booking_date_time: format(new Date(), 'EEEE, MMMM do, yyyy') + ' at 19:00',
      party_size: 2,
      special_requests: 'This is a test email from the admin dashboard',
      restaurant_name: 'Table Pilot Test',
      restaurant_address: 'Test Address',
      restaurant_phone: '01234 567890',
      restaurant_email: 'test@example.com',
    };
    
    const { data, error } = await supabase.functions.invoke('send-booking-email', {
      body: testPayload,
    });
    
    if (error) {
      console.error('❌ Test email failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send test email'
      };
    }
    
    console.log('✅ Test email sent successfully:', data);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Email service test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
