import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Booking } from './supabaseBookingService';
import { siteConfig } from '@/config/site';

/**
 * Format a booking date and time for display in emails
 */
const formatBookingDateTime = (date: string, time: string): string => {
  const bookingDate = new Date(date);
  const formattedDate = format(bookingDate, 'EEEE, MMMM do, yyyy');
  return `${formattedDate} at ${time}`;
};

/**
 * Send a booking confirmation email to the customer via Supabase edge function
 */
export const sendBookingConfirmationEmail = async (booking: Booking): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending booking confirmation email via Supabase edge function...');
    
    // Format the booking date and time for the email
    const formattedDateTime = formatBookingDateTime(booking.booking_date, booking.start_time);
    
    // Prepare email payload
    const emailPayload = {
      to_name: booking.customer_name,
      to_email: booking.customer_email,
      booking_id: booking.id,
      booking_date_time: formattedDateTime,
      party_size: booking.party_size,
      special_requests: booking.special_requests || 'None',
      restaurant_name: siteConfig.business.name,
      restaurant_address: siteConfig.contact.address,
      restaurant_phone: siteConfig.contact.phone,
      restaurant_email: siteConfig.contact.email,
    };
    
    console.log('📧 Invoking send-booking-email function...');
    
    // Invoke the Supabase edge function
    const { data, error } = await supabase.functions.invoke('send-booking-email', {
      body: emailPayload,
    });
    
    if (error) {
      console.error('❌ Failed to send confirmation email:', error);
      return { 
        success: false, 
        error: 'We couldn\'t send the confirmation email, but your booking is confirmed. Please save your booking reference.' 
      };
    }
    
    console.log('✅ Email sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    
    // Return a user-friendly error message
    return { 
      success: false, 
      error: 'We couldn\'t send the confirmation email, but your booking is confirmed. Please save your booking reference.' 
    };
  }
};
