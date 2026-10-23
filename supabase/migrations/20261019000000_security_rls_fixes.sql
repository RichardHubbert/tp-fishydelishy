-- =====================================================================
-- TablePilot: combined security fix for the shared tp- client database
-- =====================================================================
-- Replaces these four PR migrations (run THIS file instead of them):
--   tp-core        20261019000000_security_rls_fixes.sql
--   tp-woodman     20261019000000_tighten_security_rls.sql
--   tp-amicicoffee 20261019000000_tighten_rls_security.sql
--   tp-fishydelishy 20261019000000_tighten_rls_security.sql
-- and also covers the column and storage parts of:
--   20261017000000_add_elevenlabs_agent.sql
--   20261018000000_add_restaurant_settings_fields.sql   (Amici)
--   20261018000001_create_restaurants_storage.sql       (Amici)
--
-- WHERE: run it once, in Supabase project ddrkdmmoozbebzuwdnvo. All four
-- tp- sites use it, and so does the LIVE tablepilot.co.uk directory
-- (its deployed bundle points at ddrk..., even though chiltern-host-hub's
-- client.ts says uyfetotsxenwdfpfyrzs).
-- The directory's tables (venues, categories, hero_content, coverage_areas,
-- menu_items, site_settings, venue_gallery, venue_reviews, user_roles) and
-- its has_role()/assign_role_by_email() functions are deliberately NOT
-- touched, so the directory keeps working exactly as it does now.
-- The script refuses to run if the booking tables are missing.
--
-- Idempotent: safe to run more than once. It runs in one transaction,
-- so if any step fails, nothing changes.
--
-- IMPORTANT: the public booking pages need a small code change at the
-- same time (see section 9 and the notes at the bottom). Without it,
-- availability and booking creation stop working for logged-out visitors.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Safety guard: make sure this is the booking database
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL
     OR to_regclass('public.restaurants') IS NULL
     OR to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'This does not look like the TablePilot booking database (bookings/restaurants/profiles missing). Aborting.';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. Schema: columns and tables that earlier feature migrations need
-- ---------------------------------------------------------------------

-- profiles.role (the admin check depends on it)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_id uuid;

-- Categories table must exist BEFORE restaurants.category_id references it
-- (the Amici 20261018000000 migration has these in the wrong order and fails)
CREATE TABLE IF NOT EXISTS public.restaurant_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS hero_image_url      text,
  ADD COLUMN IF NOT EXISTS elevenlabs_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS elevenlabs_agent_id text,
  ADD COLUMN IF NOT EXISTS is_default          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS county              text,
  ADD COLUMN IF NOT EXISTS opening_hours       jsonb,
  ADD COLUMN IF NOT EXISTS is_active           boolean DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'restaurants'
                   AND column_name = 'category_id') THEN
    ALTER TABLE public.restaurants
      ADD COLUMN category_id uuid REFERENCES public.restaurant_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restaurants_county     ON public.restaurants(county);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_default ON public.restaurants(is_default);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS business_id uuid;

-- ---------------------------------------------------------------------
-- 2. Admin helper (named tp_is_admin so it can't clash with any is_admin()
--    or the directory's has_role() in the same database). SECURITY DEFINER so it can read profiles without
--    going through profiles' own RLS. The PR versions put
--    "EXISTS (SELECT ... FROM profiles)" inside policies ON profiles,
--    and Postgres rejects that with "infinite recursion detected in
--    policy for relation profiles". Every admin check would then error.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tp_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.tp_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tp_is_admin() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Make Richard an admin BEFORE any policy changes, so he can't be
--    locked out. Creates his profile row if the signup trigger missed it.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = 'richardhubbert@gmail.com'
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE WARNING 'No auth user with email richardhubbert@gmail.com in this project. Sign up first (or invite the user), then re-run this script.';
  ELSE
    INSERT INTO public.profiles (user_id, full_name, role)
    SELECT v_uid, 'Richard Hubbert', 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_uid);

    UPDATE public.profiles SET role = 'admin' WHERE user_id = v_uid;
    RAISE NOTICE 'richardhubbert@gmail.com (%) is admin.', v_uid;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. Stop people from making themselves admin.
--    Users may update their own profile (name etc.), but only an admin
--    or the service role / SQL editor may change role or business_id.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.business_id IS DISTINCT FROM OLD.business_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id)
     AND NOT (
       coalesce(auth.role(), '') = 'service_role'
       OR session_user IN ('postgres', 'supabase_admin')
       OR public.tp_is_admin()
     ) THEN
    RAISE EXCEPTION 'Only an admin can change role, business_id or user_id on a profile';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- ---------------------------------------------------------------------
-- 5. Drop EVERY existing policy on the managed tables.
--    The four PRs each dropped a different, partial list by name and all
--    of them missed some still-open policies, e.g.
--      bookings    "Bookings are manageable by business admin"  (FOR ALL, no login check)
--      restaurants "Restaurants are manageable by business admin" (anon could edit/delete Amici)
--      customers   "Customers are viewable/manageable by business admin" (anon could read/edit)
--      profiles    "Public can view basic profile info" (anyone could list all profiles)
--      profiles    "Allow trigger to insert profiles" (anyone could insert profiles)
--    plus any policy added by hand in the dashboard. Dropping all of them
--    and recreating one known-good set is the only reliable way.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('bookings', 'restaurants', 'tables', 'profiles',
                        'businesses', 'customers', 'restaurant_categories')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy "%" on %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 6. Turn RLS on everywhere it matters
-- ---------------------------------------------------------------------
ALTER TABLE public.bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_categories ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.tables')     IS NOT NULL THEN EXECUTE 'ALTER TABLE public.tables     ENABLE ROW LEVEL SECURITY'; END IF;
  IF to_regclass('public.businesses') IS NOT NULL THEN EXECUTE 'ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY'; END IF;
  IF to_regclass('public.customers')  IS NOT NULL THEN EXECUTE 'ALTER TABLE public.customers  ENABLE ROW LEVEL SECURITY'; END IF;
END $$;

-- ---------------------------------------------------------------------
-- 7. The new policy set
-- ---------------------------------------------------------------------

-- BOOKINGS: the public can create bookings. Only admins can read or change them.
CREATE POLICY "tp_bookings_public_insert" ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (status IS NULL OR status = 'confirmed');

CREATE POLICY "tp_bookings_admin_all" ON public.bookings
  FOR ALL TO authenticated
  USING (public.tp_is_admin())
  WITH CHECK (public.tp_is_admin());

-- RESTAURANTS: the public can read active restaurants. Admins can do everything, including inactive ones.
CREATE POLICY "tp_restaurants_public_read" ON public.restaurants
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "tp_restaurants_admin_all" ON public.restaurants
  FOR ALL TO authenticated
  USING (public.tp_is_admin())
  WITH CHECK (public.tp_is_admin());

-- RESTAURANT CATEGORIES: the public can read them (filter bar). Admins manage them.
CREATE POLICY "tp_categories_public_read" ON public.restaurant_categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "tp_categories_admin_all" ON public.restaurant_categories
  FOR ALL TO authenticated
  USING (public.tp_is_admin())
  WITH CHECK (public.tp_is_admin());

-- TABLES: the public can read them (availability and table choice). Admins manage them.
DO $$
BEGIN
  IF to_regclass('public.tables') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY "tp_tables_public_read" ON public.tables
               FOR SELECT TO anon, authenticated USING (true)$p$;
    EXECUTE $p$CREATE POLICY "tp_tables_admin_all" ON public.tables
               FOR ALL TO authenticated
               USING (public.tp_is_admin()) WITH CHECK (public.tp_is_admin())$p$;
  END IF;
END $$;

-- PROFILES: users can see and edit their own profile (role is protected by
-- the trigger in section 4). Admins can do everything. No public access.
CREATE POLICY "tp_profiles_own_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "tp_profiles_own_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tp_profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.tp_is_admin())
  WITH CHECK (public.tp_is_admin());

-- BUSINESSES and CUSTOMERS: admins only (no public page reads them)
DO $$
BEGIN
  IF to_regclass('public.businesses') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY "tp_businesses_admin_all" ON public.businesses
               FOR ALL TO authenticated
               USING (public.tp_is_admin()) WITH CHECK (public.tp_is_admin())$p$;
  END IF;
  IF to_regclass('public.customers') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY "tp_customers_admin_all" ON public.customers
               FOR ALL TO authenticated
               USING (public.tp_is_admin()) WITH CHECK (public.tp_is_admin())$p$;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 8. Triggers that write customers / profiles must keep working now that
--    anon can't touch those tables. Run them as the table owner.
--    (Without this, a public booking would still save, but the customer and
--    CRM sync would silently stop. Those functions swallow errors.)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.handle_booking_customer_creation()',
    'public.handle_booking_customer_update()',
    'public.handle_new_customer_to_crm()',
    'public.handle_customer_update_to_crm()',
    'public.handle_new_user()'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER', f);
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', f);
      RAISE NOTICE 'Function % now runs as SECURITY DEFINER', f;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 9. Public availability without exposing customer details.
--    The booking pages currently do  supabase.from('bookings').select('*')
--    to find taken slots. After this script anon can't do that. This
--    function returns only slot data (no names, emails or phones).
--    CODE CHANGE NEEDED in src/services/supabaseBookingService.ts:
--      fetchBookingsForDate ->
--        supabase.rpc('get_booking_availability', { p_date: dateString })
--      createBooking / placeBooking -> drop .select().single() after .insert()
--        (anon can no longer read the row back). Generate the id client-side
--        with crypto.randomUUID() and pass it in the insert so CRM/email
--        still get a booking id.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_booking_availability(
  p_date date,
  p_restaurant_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  table_id uuid,
  restaurant_id uuid,
  booking_date date,
  start_time time,
  end_time time,
  party_size integer,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.table_id, b.restaurant_id, b.booking_date,
         b.start_time, b.end_time, b.party_size, b.status::text
  FROM public.bookings b
  WHERE b.booking_date = p_date
    AND b.status = 'confirmed'
    AND (p_restaurant_id IS NULL OR b.restaurant_id = p_restaurant_id);
$$;

REVOKE ALL ON FUNCTION public.get_booking_availability(date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_availability(date, uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 10. Analytics views currently bypass RLS (views run as their owner),
--     so anyone with the public key can read customer names, emails and
--     phones through them. Make them respect the caller's RLS, and take
--     them away from anon entirely.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['customer_analytics', 'business_customer_analytics',
                           'business_dashboard', 'amici_coffee_dashboard'] LOOP
    IF to_regclass('public.' || v) IS NOT NULL THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v);
      RAISE NOTICE 'Secured view %', v;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 11. Storage bucket "restaurants" (hero and restaurant images)
--     Old policies let ANYONE upload, overwrite or delete images.
--     New: anyone can view, only admins can write.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurants', 'restaurants', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public uploads to restaurants bucket"            ON storage.objects;
  DROP POLICY IF EXISTS "Public reads from restaurants bucket"            ON storage.objects;
  DROP POLICY IF EXISTS "Public updates to restaurants bucket"            ON storage.objects;
  DROP POLICY IF EXISTS "Public deletes from restaurants bucket"          ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload restaurant images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update restaurant images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete restaurant images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view restaurant images"               ON storage.objects;
  DROP POLICY IF EXISTS "tp_restaurant_images_public_read"                ON storage.objects;
  DROP POLICY IF EXISTS "tp_restaurant_images_admin_insert"               ON storage.objects;
  DROP POLICY IF EXISTS "tp_restaurant_images_admin_update"               ON storage.objects;
  DROP POLICY IF EXISTS "tp_restaurant_images_admin_delete"               ON storage.objects;

  CREATE POLICY "tp_restaurant_images_public_read" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'restaurants');

  CREATE POLICY "tp_restaurant_images_admin_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'restaurants' AND public.tp_is_admin());

  CREATE POLICY "tp_restaurant_images_admin_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'restaurants' AND public.tp_is_admin())
    WITH CHECK (bucket_id = 'restaurants' AND public.tp_is_admin());

  CREATE POLICY "tp_restaurant_images_admin_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'restaurants' AND public.tp_is_admin());
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Not allowed to change storage.objects policies from here. Set the restaurants bucket policies in Dashboard > Storage > Policies instead: public SELECT; INSERT/UPDATE/DELETE only when public.tp_is_admin().';
END $$;

COMMIT;

-- ---------------------------------------------------------------------
-- 12. Check the result (read-only)
-- ---------------------------------------------------------------------
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND (tablename IN ('bookings','restaurants','tables','profiles','businesses',
                     'customers','restaurant_categories')
       OR policyname LIKE 'tp_restaurant_images_%')
ORDER BY tablename, policyname;

SELECT u.email, p.role
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE p.role = 'admin';

-- Restaurant UUIDs, so each site's config can be filled in:
SELECT id, name, is_active, is_default, business_id FROM public.restaurants ORDER BY name;

-- =====================================================================
-- NOTES (nothing below runs)
-- =====================================================================
-- Code changes to merge at the SAME time (every tp- repo, in
-- src/services/supabaseBookingService.ts):
--   1. fetchBookingsForDate: replace
--        supabase.from('bookings').select('*').eq('booking_date', d).eq('status','confirmed')
--      with
--        supabase.rpc('get_booking_availability', { p_date: d /*, p_restaurant_id: id */ })
--   2. createBooking / placeBooking: anon can insert but can no longer read
--      the row back, so .insert(...).select().single() returns an RLS error.
--      Use  const id = crypto.randomUUID();  insert { id, ... } with no
--      .select(), and build the returned Booking object locally.
--   3. tp-core and tp-amicicoffee still hard-code business_id
--      '24e2799f-...' (Amici) in the booking insert. Use the site config instead.
--
-- Each site's restaurant UUID must be set in its config, otherwise the admin
-- dashboard isn't scoped to that site:
--   tp-core         src/config/site.ts  restaurant.defaultId   = ""  (template, fine)
--   tp-woodman      src/config/site.ts  business.restaurantId  = ""  (NOT SET)
--   tp-amicicoffee  src/config/site.ts  business.restaurantId  = 24e2799f-60d5-4e3b-bb30-b8049c9ae56d (set)
--   tp-fishydelishy src/config/site.ts  ids.restaurantId       = 24e2799f-... (WRONG: Amici's)
-- The last SELECT above lists the real UUIDs.
