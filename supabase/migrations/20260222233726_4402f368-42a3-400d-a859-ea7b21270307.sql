
-- Table for section-specific content (grid icons)
CREATE TABLE public.section_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'link',
  url text,
  youtube_id text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

ALTER TABLE public.section_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage section contents" ON public.section_contents FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view section contents" ON public.section_contents FOR SELECT USING (auth.uid() IS NOT NULL);
