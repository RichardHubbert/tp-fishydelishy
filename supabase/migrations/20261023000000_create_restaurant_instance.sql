-- Lets a fresh clone create its own restaurant with the public anon key.
-- Bookings and tables for that id stay separate from every other copy.
-- The function only inserts a new row. It cannot read or change existing restaurants.

CREATE OR REPLACE FUNCTION public.create_restaurant_instance(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_name text := trim(coalesce(p_name, ''));
  v_recent integer;
BEGIN
  IF char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'Restaurant name must be between 2 and 80 characters';
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.restaurants
  WHERE created_at > now() - interval '1 hour';

  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'Too many new restaurants were created in the last hour. Try again later.';
  END IF;

  INSERT INTO public.restaurants (id, name, address, cuisine, is_active, is_default)
  VALUES (v_id, v_name, '', 'Restaurant', true, false);

  INSERT INTO public.tables (name, capacity, section, restaurant_id)
  VALUES
    ('T1', 2, 'Main Dining', v_id),
    ('T2', 4, 'Main Dining', v_id),
    ('T3', 2, 'Window', v_id),
    ('T4', 6, 'Main Dining', v_id),
    ('T5', 4, 'Patio', v_id),
    ('T6', 2, 'Bar Area', v_id),
    ('T7', 8, 'Private', v_id),
    ('T8', 4, 'Window', v_id);

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_restaurant_instance(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_restaurant_instance(text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
