
-- Add user_id to support_tickets to link logged-in user
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);

-- Allow ticket owner to view and update their own tickets
DROP POLICY IF EXISTS "Owners can view own tickets" ON public.support_tickets;
CREATE POLICY "Owners can view own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Messages table (chat thread per ticket)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_user_id uuid,
  sender_kind text NOT NULL DEFAULT 'user',
  message text,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id
  ON public.support_ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Ticket owner can read messages of their tickets
CREATE POLICY "Owner read own ticket messages"
ON public.support_ticket_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_messages.ticket_id
      AND t.user_id = auth.uid()
  )
);

-- Admins can read all messages
CREATE POLICY "Admins read all ticket messages"
ON public.support_ticket_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ticket owner can send messages to their tickets
CREATE POLICY "Owner sends ticket messages"
ON public.support_ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND sender_kind = 'user'
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
  )
);

-- Admins can send messages to any ticket
CREATE POLICY "Admins send ticket messages"
ON public.support_ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND sender_user_id = auth.uid()
  AND sender_kind = 'admin'
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;
