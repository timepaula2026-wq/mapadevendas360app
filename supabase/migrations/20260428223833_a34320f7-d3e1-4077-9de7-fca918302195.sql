
CREATE TABLE public.section_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.section_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view section tabs" ON public.section_tabs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage section tabs" ON public.section_tabs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_section_tabs_updated
  BEFORE UPDATE ON public.section_tabs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_section_tabs_section ON public.section_tabs(section_id, sort_order);

ALTER TABLE public.section_contents
  ADD COLUMN tab_id UUID REFERENCES public.section_tabs(id) ON DELETE CASCADE;

CREATE INDEX idx_section_contents_tab ON public.section_contents(tab_id);
