ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS grid_cols_mobile integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS grid_cols_tablet integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS grid_cols_desktop integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS icon_size_mobile integer NOT NULL DEFAULT 36,
  ADD COLUMN IF NOT EXISTS icon_size_tablet integer NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS icon_size_desktop integer NOT NULL DEFAULT 56;