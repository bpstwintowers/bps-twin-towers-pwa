-- Script to assign 'Event Admin' role to ashwin.designer@gmail.com
-- Project Ref: polyjkevdswpsllcgtsk
-- Run this in the Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/polyjkevdswpsllcgtsk/sql/new

DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  -- 1. Look up user ID from auth.users (or profiles fallback)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER('ashwin.designer@gmail.com');

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER('ashwin.designer@gmail.com');
  END IF;

  -- 2. Verify or create the 'Event Admin' role in public.roles
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'Event Admin';

  IF v_role_id IS NULL THEN
    INSERT INTO public.roles (name)
    VALUES ('Event Admin')
    RETURNING id INTO v_role_id;
  END IF;

  -- 3. Assign role to user if found
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RAISE NOTICE 'SUCCESS: Assigned "Event Admin" role to ashwin.designer@gmail.com (User ID: %)', v_user_id;
  ELSE
    RAISE WARNING 'User ashwin.designer@gmail.com not yet registered in auth.users. Please have the user sign in or register first, then rerun this script.';
  END IF;
END $$;

-- Verification Query
SELECT 
  u.email,
  p.full_name,
  r.name AS assigned_role
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
JOIN auth.users u ON ur.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE LOWER(u.email) = 'ashwin.designer@gmail.com';
