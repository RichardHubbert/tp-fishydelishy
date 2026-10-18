import emailjs from '@emailjs/browser';
import { format } from 'date-fns';
import { Booking } from './supabaseBookingService';
import { siteConfig } from '@/config/site';

// EmailJS service configuration
const SERVICE_ID = 'service_fvy9wzm'; // EmailJS service ID
const TEMPLATE_ID = 'template_hvudejb'; // TODO: Replace with your actual EmailJS template ID from dashboard
const PUBLIC_KEY = 'CrvLAsC5DKRwVy5jR'; // EmailJS public key

/**
 * Format a booking date and time for display in emails
 */
const formatBookingDateTime = (date: string, time: string): string => {
  const bookingDate = new Date(date);
  const formattedDate = format(bookingDate, 'EEEE, MMMM do, yyyy');
  return `${formattedDate} at ${time}`;
};

/**
 * Send a booking confirmation email to the customer
 */
export const sendBookingConfirmationEmail = async (booking: Booking): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Preparing to send booking confirmation email...');
    console.log('📧 EmailJS Config:', { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY });
    
    // Format the booking date and time for the email
    const formattedDateTime = formatBookingDateTime(booking.booking_date, booking.start_time);
    
    // Prepare template parameters
    const templateParams = {
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
    
    console.log('📧 Sending confirmation email with params:', templateParams);
    
    // Send the email using EmailJS
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    
    console.log('✅ Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    console.error('❌ Email error details:', {
      error,
      errorMessage,
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID,
      publicKey: PUBLIC_KEY?.substring(0, 10) + '...'
    });
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Initialize EmailJS
 */
export const initEmailService = (): void => {
  try {
    emailjs.init(PUBLIC_KEY);
    console.log('📧 EmailJS service initialized successfully');
    console.log('📧 EmailJS config:', { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY: PUBLIC_KEY?.substring(0, 10) + '...' });
  } catch (error) {
    console.error('❌ Failed to initialize EmailJS:', error);
  }
};

/**
 * Test EmailJS configuration
 */
export const testEmailService = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🧪 Testing EmailJS configuration...');
    
    const testParams = {
      to_name: 'Test User',
      to_email: 'test@example.com',
      booking_id: 'TEST-123',
      booking_date_time: 'Test Date and Time',
      party_size: 2,
      special_requests: 'Test request',
      restaurant_name: 'Test Restaurant',
      restaurant_address: 'Test Address, London, UK',
      restaurant_phone: '+44 20 7946 0958',
      restaurant_email: 'test@restaurant.com',
    };
    
    console.log('🧪 Test params:', testParams);
    
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      testParams,
      PUBLIC_KEY
    );
    
    console.log('✅ EmailJS test successful:', response);
    return { success: true };
  } catch (error) {
    console.error('❌ EmailJS test failed:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    return { success: false, error: errorMessage };
  }
};
