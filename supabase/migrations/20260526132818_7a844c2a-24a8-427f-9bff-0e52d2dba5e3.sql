
-- Habilita pg_cron para agendar tarefas
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Função que revoga acesso de consultores iniciantes inativos há mais de 15 dias
CREATE OR REPLACE FUNCTION public.revoke_inactive_iniciantes()
RETURNS TABLE(revoked_user_id uuid, display_name text, last_active_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.profiles p
     SET approved = false,
         updated_at = now()
   WHERE p.approved = true
     AND p.last_active_at IS NOT NULL
     AND p.last_active_at < (now() - interval '15 days')
     AND EXISTS (
       SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role = 'iniciante'::app_role
     )
     -- Nunca revoga admins, mesmo que também tenham role iniciante
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles ur2
        WHERE ur2.user_id = p.user_id
          AND ur2.role = 'admin'::app_role
     )
  RETURNING p.user_id, p.display_name, p.last_active_at;
END;
$$;

-- Remove job antigo se existir e reagenda diariamente às 03:00 UTC (00:00 BRT)
DO $$
BEGIN
  PERFORM cron.unschedule('revoke-inactive-iniciantes-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'revoke-inactive-iniciantes-daily',
  '0 3 * * *',
  $$SELECT public.revoke_inactive_iniciantes();$$
);
