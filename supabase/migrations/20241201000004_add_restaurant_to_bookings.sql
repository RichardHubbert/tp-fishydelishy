-- Create tables table if it doesn't exist
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  section VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add restaurant_id column to existing bookings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'restaurant_id') THEN
    -- Column already exists, do nothing
    RAISE NOTICE 'restaurant_id column already exists in bookings table';
  ELSE
    -- Add the column
    ALTER TABLE bookings ADD COLUMN restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added restaurant_id column to bookings table';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_table_id ON bookings(table_id);
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant_id ON bookings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create updated_at trigger for bookings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for bookings table
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for tables table
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
CREATE TRIGGER update_tables_updated_at 
    BEFORE UPDATE ON tables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tables if none exist
INSERT INTO tables (name, capacity, section) 
SELECT 'Table 1', 2, 'Main Dining'
WHERE NOT EXISTS (SELECT 1 FROM tables);

INSERT INTO tables (name, capacity, section) 
SELECT 'Table 2', 4, 'Main Dining'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 2');

INSERT INTO tables (name, capacity, section) 
SELECT 'Table 3', 6, 'Main Dining'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 3');

INSERT INTO tables (name, capacity, section) 
SELECT 'Table 4', 8, 'Private Room'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Table 4'); 