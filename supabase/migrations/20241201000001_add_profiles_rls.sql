-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for admin users to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy for admin users to manage all profiles (fallback for original admin)
CREATE POLICY "Original admin can manage all profiles" ON profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'richardhubbert@gmail.com'
  );

-- Create policy for public read access to basic profile info (for display purposes)
CREATE POLICY "Public can view basic profile info" ON profiles
  FOR SELECT USING (true);

-- Create policy to allow trigger function to insert profiles
CREATE POLICY "Allow trigger to insert profiles" ON profiles
  FOR INSERT WITH CHECK (true); 