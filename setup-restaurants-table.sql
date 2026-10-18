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

-- Insert some sample restaurants
INSERT INTO restaurants (name, address, cuisine, rating, image_url, phone, email, description) VALUES
('Amici Coffee', '123 Fine Dining Street, London, UK', 'Fine Dining', 4.8, '/lovable-uploads/d1a98a63-2cc5-4972-9f0d-87d62451a02b.png', '+44 20 7946 0958', 'contact@tablepilot.com', 'Experience fine dining with breathtaking views. Reserve your table for an unforgettable culinary journey.'),
('Bella Vista', '456 Ocean View Drive, London, UK', 'Italian', 4.6, '/lovable-uploads/1cf1aa04-79c2-4d2b-b395-ab316329e682.png', '+44 20 7946 0959', 'info@bellavista.com', 'Authentic Italian cuisine with stunning ocean views. Fresh ingredients and traditional recipes.'),
('Sakura Sushi', '789 Cherry Blossom Lane, London, UK', 'Japanese', 4.7, '/lovable-uploads/22fb2312-3451-410b-b60b-065eee5f03d4.png', '+44 20 7946 0960', 'reservations@sakura.com', 'Premium sushi and Japanese cuisine in an elegant setting. Fresh fish and traditional preparation methods.'),
('Le Petit Bistro', '321 French Quarter, London, UK', 'French', 4.5, '/lovable-uploads/50a6f4cc-7462-41e4-9627-b959d48a17d0.png', '+44 20 7946 0961', 'contact@lepetitbistro.com', 'Charming French bistro serving classic dishes with a modern twist. Cozy atmosphere and excellent wine selection.'),
('Spice Garden', '654 Curry Road, London, UK', 'Indian', 4.4, '/lovable-uploads/63f65980-577a-4131-8e56-1a624cfca4b8.png', '+44 20 7946 0962', 'info@spicegarden.com', 'Authentic Indian cuisine with a wide variety of dishes. Spicy and mild options available for all palates.'); 