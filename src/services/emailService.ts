import { format } from 'date-fns';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { Booking } from './supabaseBookingService';
import { siteConfig } from '@/config/site';

type EmailPayload = {
  to_name: string;
  to_email: string;
  booking_id: string;
  booking_date_time: string;
  party_size: number;
  special_requests: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email: string;
};

const formatBookingDateTime = (date: string, time: string): string => {
  const bookingDate = new Date(date);
  const formattedDate = format(bookingDate, 'EEEE, MMMM do, yyyy');
  return `${formattedDate} at ${time}`;
};

const readInvokeError = async (error: unknown): Promise<string> => {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json();
        if (body?.error) return String(body.error);
      } catch {
        // The response body was not JSON.
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to send confirmation email';
};

const sendWithResend = async (payload: EmailPayload): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.functions.invoke('send-booking-email', {
    body: payload,
  });

  if (error) {
    return { success: false, error: await readInvokeError(error) };
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { success: false, error: String(data.error) };
  }

  return { success: true };
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
      restaurant_name: booking.restaurant?.name || siteConfig.business.name,
      restaurant_address: booking.restaurant?.address || '',
      restaurant_phone: booking.restaurant?.phone || '',
      restaurant_email: booking.restaurant?.email || '',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send confirmation email';
    return { success: false, error: errorMessage };
  }
};

export const testEmailService = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    return await sendWithResend({
      to_name: 'Richard',
      to_email: 'richardhubbert@gmail.com',
      booking_id: 'TEST-123',
      booking_date_time: 'Saturday, October 17th, 2026 at 19:00',
      party_size: 2,
      special_requests: 'This is a test reservation email.',
      restaurant_name: siteConfig.business.name,
      restaurant_address: 'Address to be confirmed',
      restaurant_phone: '',
      restaurant_email: '',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send test email';
    return { success: false, error: errorMessage };
  }
};
