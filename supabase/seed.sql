-- Insert initial admin user profile
-- This assumes the auth user already exists with email 'richardhubbert@gmail.com'
INSERT INTO profiles (user_id, full_name, company_name, role)
SELECT 
  id,
  'Richard Hubbert',
  'TablePilot',
  'admin'
FROM auth.users 
WHERE email = 'richardhubbert@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  full_name = 'Richard Hubbert',
  company_name = 'TablePilot'; 