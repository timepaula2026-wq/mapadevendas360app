
REVOKE EXECUTE ON FUNCTION public.revoke_inactive_iniciantes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_inactive_iniciantes() FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_inactive_iniciantes() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_inactive_iniciantes() TO service_role;
