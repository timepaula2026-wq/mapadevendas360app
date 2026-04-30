ALTER TABLE public.section_contents
ADD COLUMN IF NOT EXISTS open_mode text NOT NULL DEFAULT 'iframe';

ALTER TABLE public.section_contents
DROP CONSTRAINT IF EXISTS section_contents_open_mode_check;

ALTER TABLE public.section_contents
ADD CONSTRAINT section_contents_open_mode_check
CHECK (open_mode IN ('iframe','newtab'));