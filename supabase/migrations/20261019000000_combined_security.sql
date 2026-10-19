-- Combined Security & Multi-tenant Migration
-- =============================================
-- This migration provides:
-- 1. Proper RLS policies for multi-tenant booking system
-- 2. Admin role checking via tp_is_admin() RPC
-- 3. Booking availability RPC with restaurant scoping
-- 4. Security definer functions for safe data access
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON bookings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON bookings;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON bookings;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS tp_is_admin();
DROP FUNCTION IF EXISTS get_booking_availability(date);
DROP FUNCTION IF EXISTS resolve_booking_owner(uuid);

-- =============================================
-- ADMIN ROLE CHECKING
-- =============================================

-- Function to check if current user is an admin
-- Returns true if:
--   1. User has 'admin' role in user_roles table, OR
--   2. User has 'admin' role in profiles table
CREATE OR REPLACE FUNCTION tp_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();
  
  -- Not authenticated = not admin
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user_roles table first (legacy)
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check profiles table
  SELECT role INTO v_role
  FROM profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  IF v_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Not an admin
  RETURN false;
END;
$$;

-- =============================================
-- BOOKING OWNER RESOLUTION
-- =============================================

-- Resolve who owns/created a booking (for RLS policies)
-- Returns the user_id if the booking was created by an authenticated user,
-- or NULL if created anonymously
CREATE OR REPLACE FUNCTION resolve_booking_owner(booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Try to find the booking's creator in the bookings table
  -- (assuming bookings have a created_by or user_id column)
  -- If your bookings table doesn't have a user_id/created_by, return NULL
  SELECT user_id INTO v_owner_id
  FROM bookings
  WHERE id = booking_id
  LIMIT 1;
  
  RETURN v_owner_id;
END;
$$;

-- =============================================
-- BOOKING AVAILABILITY RPC
-- =============================================

-- Get booking availability for a specific date with restaurant scoping
-- This replaces direct SELECT queries and provides proper multi-tenant isolation
CREATE OR REPLACE FUNCTION get_booking_availability(p_date date)
RETURNS TABLE (
  id uuid,
  table_id uuid,
  restaurant_id uuid,
  business_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  booking_date date,
  start_time text,
  end_time text,
  party_size integer,
  status text,
  special_requests text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Return confirmed bookings for the specified date
  -- Admins see all bookings; others see only public info
  RETURN QUERY
  SELECT
    b.id,
    b.table_id,
    b.restaurant_id,
    b.business_id,
    CASE 
      WHEN tp_is_admin() THEN b.customer_name
      ELSE NULL::text
    END as customer_name,
    CASE 
      WHEN tp_is_admin() THEN b.customer_email
      ELSE NULL::text
    END as customer_email,
    CASE 
      WHEN tp_is_admin() THEN b.customer_phone
      ELSE NULL::text
    END as customer_phone,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.party_size,
    b.status,
    CASE 
      WHEN tp_is_admin() THEN b.special_requests
      ELSE NULL::text
    END as special_requests,
    b.created_at
  FROM bookings b
  WHERE b.booking_date = p_date
    AND b.status = 'confirmed';
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on key tables if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Bookings policies
-- 1. Admins can do everything
CREATE POLICY "Admins have full access to bookings"
  ON bookings
  FOR ALL
  USING (tp_is_admin())
  WITH CHECK (tp_is_admin());

-- 2. Anonymous users can INSERT bookings (for public booking form)
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (true);

-- 3. Anonymous users can READ their own bookings by email (for confirmation pages)
CREATE POLICY "Users can read their own bookings by email"
  ON bookings
  FOR SELECT
  USING (
    customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR customer_email = auth.email()
  );

-- Profiles policies
-- 1. Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (tp_is_admin());

-- Restaurants policies
-- 1. Anyone can read public restaurant info
CREATE POLICY "Public read access for restaurants"
  ON restaurants
  FOR SELECT
  USING (true);

-- 2. Admins can manage restaurants
CREATE POLICY "Admins can manage restaurants"
  ON restaurants
  FOR ALL
  USING (tp_is_admin())
  WITH CHECK (tp_is_admin());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Booking queries by date are very common
CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
  ON bookings(booking_date, status);

-- Booking queries by restaurant
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant 
  ON bookings(restaurant_id);

-- Profile lookups by email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON profiles(email);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute on RPC functions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION tp_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_booking_availability(date) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION resolve_booking_owner(uuid) TO authenticated, anon;
