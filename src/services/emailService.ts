import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from './supabaseBookingService';

type EmailPayload = {
  to_name: string;
  to_email: string;
  booking_id: string;
  booking_date_time: string;
  party_size: number;
  special_requests: string;
  restaurant_id?: string;
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_phone?: string;
  restaurant_email?: string;
};

const formatBookingDateTime = (date: string, time: string): string => {
  const bookingDate = new Date(date);
  const formattedDate = format(bookingDate, 'EEEE, MMMM do, yyyy');
  return `${formattedDate} at ${time}`;
};

const sendWithResend = async (payload: EmailPayload): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-booking-email', {
      body: payload,
    });

    if (error) {
      console.error('Email function error:', error);
      // Return user-friendly error message
      return { success: false, error: 'Unable to send confirmation email. Your booking is confirmed, but the email could not be delivered.' };
    }

    if (data && typeof data === 'object' && 'error' in data && data.error) {
      console.error('Email service error:', data.error);
      return { success: false, error: 'Unable to send confirmation email. Your booking is confirmed, but the email could not be delivered.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending exception:', error);
    return { success: false, error: 'Unable to send confirmation email. Your booking is confirmed, but the email could not be delivered.' };
  }
};

export const sendBookingConfirmationEmail = async (booking: Booking): Promise<{ success: boolean; error?: string }> => {
  try {
    return await sendWithResend({
      to_name: booking.customer_name,
      to_email: booking.customer_email,
      booking_id: booking.id,
      booking_date_time: formatBookingDateTime(booking.booking_date, booking.start_time),
      party_size: booking.party_size,
      special_requests: booking.special_requests || 'None',
      restaurant_id: booking.restaurant_id, // Pass restaurant ID so edge function can fetch details
      restaurant_name: booking.restaurant?.name,
      restaurant_address: booking.restaurant?.address,
      restaurant_phone: booking.restaurant?.phone,
      restaurant_email: booking.restaurant?.email,
    });
  } catch (error) {
    console.error('Email confirmation error:', error);
    return { 
      success: false, 
      error: 'Unable to send confirmation email. Your booking is confirmed, but the email could not be delivered.'
    };
  }
};

