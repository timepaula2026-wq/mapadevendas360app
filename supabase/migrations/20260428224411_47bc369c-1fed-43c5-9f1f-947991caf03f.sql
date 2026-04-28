
ALTER TABLE public.section_tabs REPLICA IDENTITY FULL;
ALTER TABLE public.section_contents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_tabs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_contents;
