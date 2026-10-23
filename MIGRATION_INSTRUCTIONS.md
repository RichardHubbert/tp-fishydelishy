# SQL Migration Instructions for tp-core Security Fixes

## ⚠️ IMPORTANT: Combined Migration

This migration (`supabase/migrations/20261019000000_security_rls_fixes.sql`) is the **combined_security.sql** file that consolidates security fixes across **all four tp- sites**:
- tp-core
- tp-woodman
- tp-amicicoffee
- tp-fishydelishy

**Run this migration ONCE** on the shared Supabase project (ddrkdmmoozbebzuwdnvo). It replaces individual security migrations from each site.

## Required Steps

### 1. Run the Combined RLS Security Migration

**Location:** `supabase/migrations/20261019000000_security_rls_fixes.sql`

**How to run:**

#### Option A: Supabase Dashboard (Recommended)
1. Log in to Supabase project **ddrkdmmoozbebzuwdnvo**
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/20261019000000_security_rls_fixes.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

The migration will:
- ✅ Automatically make richardhubbert@gmail.com an admin
- ✅ Create the `tp_is_admin()` function
- ✅ Create the `get_booking_availability()` RPC
- ✅ Drop all existing overly permissive policies
- ✅ Create new restrictive RLS policies
- ✅ Add a privilege protection trigger
- ✅ Secure the restaurants storage bucket
- ✅ Output a table of restaurant UUIDs at the end

### 2. Note the Restaurant UUIDs

After running the migration, it will output:

```
SELECT id, name, is_active, is_default, business_id FROM public.restaurants ORDER BY name;
```

Copy the UUID for **your restaurant** from this output.

### 3. Configure Each Site

Each tp- site needs its correct restaurant UUID in config:

**tp-core** (`src/config/site.ts`):
```typescript
restaurant: {
  defaultId: "", // TODO: Set from migration output
}
```

**Note:** tp-woodman, tp-amicicoffee, and tp-fishydelishy have similar configs with different field names.

## What the Migration Does

### Security Functions Created:

**`tp_is_admin()`:**
- SECURITY DEFINER function that safely checks if the current user has admin role
- Prevents recursive RLS policy errors
- Used by all admin checks in the code

**`get_booking_availability(p_date, p_restaurant_id)`:**
- Returns only slot data (id, table_id, restaurant_id, booking_date, start_time, end_time, party_size, status)
- **Does NOT return** customer_name, customer_email, customer_phone, or special_requests
- Anonymous users can check availability without seeing customer data

### RLS Policies Created:

**Bookings:**
- `tp_bookings_public_insert` - Anonymous can insert bookings
- `tp_bookings_admin_all` - Only admins can read/update/delete

**Restaurants:**
- `tp_restaurants_public_read` - Anonymous can read active restaurants
- `tp_restaurants_admin_all` - Only admins can manage

**Restaurant Categories:**
- `tp_categories_public_read` - Anonymous can read categories
- `tp_categories_admin_all` - Only admins can manage

**Tables:**
- `tp_tables_public_read` - Anonymous can read tables
- `tp_tables_admin_all` - Only admins can manage

**Profiles:**
- `tp_profiles_own_read` - Users can read their own profile
- `tp_profiles_own_update` - Users can update their own profile (role protected by trigger)
- `tp_profiles_admin_all` - Admins can access all profiles

**Businesses & Customers:**
- `tp_businesses_admin_all` - Admin only
- `tp_customers_admin_all` - Admin only

**Storage (restaurants bucket):**
- `tp_restaurant_images_public_read` - Public can view images
- `tp_restaurant_images_admin_insert/update/delete` - Only admins can upload/modify

### Triggers & Functions Secured:

Made SECURITY DEFINER so they can write to protected tables:
- `handle_booking_customer_creation()`
- `handle_booking_customer_update()`
- `handle_new_customer_to_crm()`
- `handle_customer_update_to_crm()`
- `handle_new_user()`

Added trigger:
- `protect_profile_privileges` - Prevents users from changing their own role or business_id

### Admin User:

Automatically makes richardhubbert@gmail.com an admin (if the account exists).

### Columns Added:

If missing, adds these columns:
- `profiles.role` (text)
- `profiles.business_id` (uuid)
- `restaurants.hero_image_url` (text)
- `restaurants.elevenlabs_enabled` (boolean)
- `restaurants.elevenlabs_agent_id` (text)
- `restaurants.is_default` (boolean)
- `restaurants.county` (text)
- `restaurants.opening_hours` (jsonb)
- `restaurants.is_active` (boolean)
- `restaurants.category_id` (uuid, references restaurant_categories)
- `bookings.business_id` (uuid)

## Code Changes Required (Already Done in This PR)

### 1. fetchBookingsForDate
**Before:**
```typescript
supabase.from('bookings').select('*').eq('booking_date', dateString)
```

**After:**
```typescript
supabase.rpc('get_booking_availability', { p_date: dateString })
```

### 2. createBooking / placeBooking
**Before:**
```typescript
const { data, error } = await supabase.from('bookings').insert(...).select().single();
return data;
```

**After:**
```typescript
const bookingId = crypto.randomUUID();
const { error } = await supabase.from('bookings').insert({ id: bookingId, ... });
// Build booking object locally
const createdBooking = { id: bookingId, ... };
return createdBooking;
```

### 3. Remove Hardcoded business_id
**Before:**
```typescript
business_id: '24e2799f-60d5-4e3b-bb30-b8049c9ae56d', // Amici Coffee
```

**After:**
```typescript
business_id: siteConfig.restaurant.defaultId || null,
```

### 4. Admin Check
**Before:**
```typescript
supabase.from('profiles').select('role').eq('user_id', user.id)
```

**After:**
```typescript
supabase.rpc('tp_is_admin')
```

## Verify After Migration

```sql
-- Check who has admin access:
SELECT u.email, p.role
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE p.role = 'admin';

-- Check restaurant UUIDs:
SELECT id, name, is_active, is_default, business_id 
FROM public.restaurants 
ORDER BY name;

-- Verify RLS policies exist:
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tp_%'
ORDER BY tablename, policyname;

-- Test the admin function:
SELECT public.tp_is_admin(); -- Should return true if you're admin

-- Test availability RPC:
SELECT * FROM public.get_booking_availability('2026-10-20');
```

## Rollback (Emergency Only)

⚠️ **WARNING:** This reopens the security holes! Only use in emergency.

```sql
-- Drop the new policies
DROP POLICY IF EXISTS "tp_bookings_public_insert" ON public.bookings;
DROP POLICY IF EXISTS "tp_bookings_admin_all" ON public.bookings;

-- Re-enable public read (NOT RECOMMENDED - SECURITY HOLE)
CREATE POLICY "Bookings are viewable by everyone" ON public.bookings
  FOR SELECT USING (true);
```

## Testing Checklist

After deploying the code and running the migration:

1. ✅ Try visiting `/admin` without login → Should require authentication
2. ✅ Log in as non-admin → Should show "Access Denied"
3. ✅ Log in as admin → Should see dashboard
4. ✅ **Test public booking form** → Should still work (RPC + local UUID)
5. ✅ Verify dashboard only shows configured restaurant's bookings
6. ✅ Check homepage displays tagline
7. ✅ Verify time slots match configured hours in site.ts

## Support

The migration output will show:
- All dropped policies (with "Dropped policy" notices)
- Admin status for richardhubbert@gmail.com
- SECURITY DEFINER functions updated
- Final policy list
- Admin users list
- Restaurant UUIDs

If any step fails, the entire migration is rolled back (it runs in a transaction).
