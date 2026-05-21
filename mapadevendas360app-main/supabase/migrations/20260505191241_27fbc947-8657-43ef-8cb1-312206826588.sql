
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
CREATE POLICY "Users view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view blocked slots" ON public.blocked_slots;
CREATE POLICY "Authenticated users view blocked slots"
  ON public.blocked_slots FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view active schedule configs" ON public.schedule_configs;
CREATE POLICY "Authenticated users view active schedule configs"
  ON public.schedule_configs FOR SELECT
  TO authenticated
  USING (active = true);
