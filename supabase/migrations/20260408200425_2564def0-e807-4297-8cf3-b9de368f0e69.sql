
CREATE TABLE public.feedback_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'sugestao',
  message TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can send feedback"
ON public.feedback_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all feedback"
ON public.feedback_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feedback"
ON public.feedback_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
