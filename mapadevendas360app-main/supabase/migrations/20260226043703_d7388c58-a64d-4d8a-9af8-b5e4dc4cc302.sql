
-- Schedule configurations: defines available time slots per unit/responsible
CREATE TABLE public.schedule_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit TEXT NOT NULL,
  responsible TEXT NOT NULL,
  service_type TEXT DEFAULT 'Geral',
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule configs"
  ON public.schedule_configs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active schedule configs"
  ON public.schedule_configs FOR SELECT
  USING (active = true);

-- Blocked slots: manually blocked times
CREATE TABLE public.blocked_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  unit TEXT,
  responsible TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked slots"
  ON public.blocked_slots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view blocked slots"
  ON public.blocked_slots FOR SELECT
  USING (true);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  unit TEXT NOT NULL,
  responsible TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Triggers for updated_at
CREATE TRIGGER update_schedule_configs_updated_at
  BEFORE UPDATE ON public.schedule_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Unique constraint to prevent double booking
CREATE UNIQUE INDEX idx_no_double_booking
  ON public.appointments (unit, responsible, date, start_time)
  WHERE status != 'cancelado';
