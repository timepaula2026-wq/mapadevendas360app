-- Fix handle_new_user trigger to assign roles based on atividade field.
-- Hierarchy rules (enforced in frontend via expandRoles; DB stores only the single highest role):
--   iniciante sem matrícula  → role: iniciante
--   iniciante com matrícula  → role: autorizado  (implica iniciante via hierarquia)
--   autorizado               → role: autorizado
--   supervisor               → role: supervisor  (implica autorizado + iniciante)
--   gestor                   → role: gestor      (implica supervisor + autorizado + iniciante)
--   secretaria               → role: secretaria  (implica gestor + supervisor + autorizado + iniciante)
--   administrativo           → sem papel automático, aguarda aprovação manual
-- admin role always bypasses all locks (handled in IconGrid.tsx)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_cpf text;
  is_auto_approved boolean;
  user_atividade text;
  has_matricula boolean;
BEGIN
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  is_auto_approved := COALESCE((NEW.raw_user_meta_data->>'auto_approved')::boolean, false);
  user_atividade := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'atividade', '')));
  has_matricula := length(trim(coalesce(user_cpf, ''))) > 0;

  INSERT INTO public.profiles (user_id, display_name, phone, unit, unit_start_date, last_active_at, cpf, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'unit',
    COALESCE((NEW.raw_user_meta_data->>'unit_start_date')::date, CURRENT_DATE),
    now(),
    user_cpf,
    NEW.email,
    is_auto_approved
  );

  -- Atribuição automática de papel único (hierarquia expandida no frontend)
  IF user_atividade = 'iniciante' THEN
    IF has_matricula THEN
      -- Iniciante com matrícula → Consultor Autorizado (tem acesso de Autorizado + Iniciante)
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'autorizado'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      -- Iniciante sem matrícula → apenas Iniciante
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'iniciante'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

  ELSIF user_atividade = 'autorizado' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'autorizado'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSIF user_atividade = 'supervisor' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'supervisor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSIF user_atividade = 'gestor' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'gestor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSIF user_atividade = 'secretaria' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'secretaria'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  -- administrativo e outros: sem papel automático, aguarda admin
  END IF;

  RETURN NEW;
END;
$function$;
