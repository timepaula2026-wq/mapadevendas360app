
CREATE OR REPLACE FUNCTION public.revoke_inactive_iniciantes()
RETURNS TABLE(revoked_user_id uuid, display_name text, last_active_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy_start_date timestamptz := '2026-06-15 00:00:00+00';
BEGIN
  -- A regra só vale a partir de 15/06/2026. Antes disso, não faz nada.
  IF now() < policy_start_date THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.profiles p
     SET approved = false,
         updated_at = now()
   WHERE p.approved = true
     AND p.last_active_at IS NOT NULL
     -- Considera o maior entre a última atividade real e a data de início da regra,
     -- de modo que ninguém é revogado por inatividade anterior a 15/06/2026.
     AND GREATEST(p.last_active_at, policy_start_date) < (now() - interval '15 days')
     AND EXISTS (
       SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role = 'iniciante'::app_role
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles ur2
        WHERE ur2.user_id = p.user_id
          AND ur2.role = 'admin'::app_role
     )
  RETURNING p.user_id, p.display_name, p.last_active_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_inactive_iniciantes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_inactive_iniciantes() TO service_role;
