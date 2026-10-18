-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  cuisine VARCHAR(100) NOT NULL,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  image_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  opening_hours JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(is_active);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants
  FOR SELECT USING (is_active = true);

-- Create policy for admin users to manage restaurants
CREATE POLICY "Restaurants are manageable by admin" ON restaurants
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'richardhubbert@gmail.com'
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_restaurants_updated_at 
  BEFORE UPDATE ON restaurants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 