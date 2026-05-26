
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text,
  email text NOT NULL,
  message text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'open',
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit support tickets"
ON public.support_tickets FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tickets"
ON public.support_tickets FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_support_tickets_updated
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload support attachments"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'support-attachments');

CREATE POLICY "Public can read support attachments"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'support-attachments');
