-- Tighten RLS Security for Fishy Delishy
-- This migration restricts anonymous access and removes email-based admin checks

-- ============================================
-- BOOKINGS TABLE
-- ============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;
DROP POLICY IF EXISTS "Bookings are manageable by admin" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;

-- Allow anonymous users to INSERT bookings only (for public booking form)
CREATE POLICY "Anonymous users can create bookings" ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email');

-- Allow admin users (role='admin') to manage all bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Drop old email-based admin policy
DROP POLICY IF EXISTS "Original admin can manage all profiles" ON profiles;

-- Keep existing policies:
-- - "Users can view own profile"
-- - "Users can update own profile"  
-- - "Admins can manage all profiles" (uses role='admin')
-- - "Public can view basic profile info"
-- - "Allow trigger to insert profiles"

-- ============================================
-- RESTAURANTS TABLE
-- ============================================

-- Allow anonymous users to READ public restaurant info
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;

CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Allow admin users (role='admin') to manage restaurants
DROP POLICY IF EXISTS "Admins can manage restaurants" ON restaurants;

CREATE POLICY "Admins can manage all restaurants" ON restaurants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- TABLES TABLE
-- ============================================

-- Allow public read access to tables (needed for availability checking)
DROP POLICY IF EXISTS "Tables are viewable by everyone" ON tables;

CREATE POLICY "Public can view tables" ON tables
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow admin users (role='admin') to manage tables
DROP POLICY IF EXISTS "Tables are manageable by admin" ON tables;

CREATE POLICY "Admins can manage tables" ON tables
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- CUSTOMERS TABLE (if exists)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "Customers manageable by admin" ON customers;
    DROP POLICY IF EXISTS "Original admin can manage customers" ON customers;
    
    -- Only admins can view/manage customers
    CREATE POLICY "Admins can manage customers" ON customers
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
