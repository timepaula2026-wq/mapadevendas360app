WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tab_id ORDER BY sort_order NULLS LAST, created_at) - 1 AS rn
  FROM public.section_contents
  WHERE tab_id IS NOT NULL
)
UPDATE public.section_contents sc
SET sort_order = ranked.rn
FROM ranked
WHERE sc.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY sort_order NULLS LAST, created_at) - 1 AS rn
  FROM public.section_tabs
)
UPDATE public.section_tabs st
SET sort_order = ranked.rn
FROM ranked
WHERE st.id = ranked.id;