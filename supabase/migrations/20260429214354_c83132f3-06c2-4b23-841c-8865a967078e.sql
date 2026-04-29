ALTER TABLE public.section_contents
ADD COLUMN parent_id uuid REFERENCES public.section_contents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_section_contents_parent_id ON public.section_contents(parent_id);