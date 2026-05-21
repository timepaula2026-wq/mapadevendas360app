
CREATE TABLE public.banner_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  video_url TEXT,
  youtube_id TEXT,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  link_type TEXT NOT NULL DEFAULT 'none' CHECK (link_type IN ('none', 'internal', 'external')),
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banner slides"
ON public.banner_slides FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage banner slides"
ON public.banner_slides FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
