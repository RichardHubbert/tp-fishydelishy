// Re-export everything from the Supabase service
export * from '@/services/supabaseBookingService';

// Keep the old interface exports for backward compatibility
export type { Table, Booking } from '@/services/supabaseBookingService';
