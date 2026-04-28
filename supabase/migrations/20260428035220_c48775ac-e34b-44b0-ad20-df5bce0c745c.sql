-- Add CPF column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- Update handle_new_user to also persist cpf from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, unit, unit_start_date, last_active_at, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'unit',
    COALESCE((NEW.raw_user_meta_data->>'unit_start_date')::date, CURRENT_DATE),
    now(),
    NEW.raw_user_meta_data->>'cpf'
  );
  RETURN NEW;
END;
$function$;