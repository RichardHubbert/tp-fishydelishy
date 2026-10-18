-- Enable Row Level Security on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to bookings
CREATE POLICY "Bookings are viewable by everyone" ON bookings
  FOR SELECT USING (true);

-- Create policy for admin users to manage bookings (insert, update, delete)
CREATE POLICY "Bookings are manageable by admin" ON bookings
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'richardhubbert@gmail.com'
  );

-- Create policy for authenticated users to create bookings
CREATE POLICY "Authenticated users can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  ); 