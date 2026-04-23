
-- Reset admin password and ensure admin role + approved profile
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Find or create admin user
  SELECT id INTO admin_id FROM auth.users WHERE email = 'suporteapp9@gmail.com';

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'suporteapp9@gmail.com', crypt('243100', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Admin"}'::jsonb,
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'suporteapp9@gmail.com'), 'email', admin_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('243100', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = admin_id;
  END IF;

  -- Ensure profile exists and is approved
  INSERT INTO public.profiles (user_id, display_name, approved)
  VALUES (admin_id, 'Admin', true)
  ON CONFLICT (user_id) DO UPDATE SET approved = true;

  -- Ensure admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
