-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transaction_paid', 'transaction_created', 'user_action', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_business_user ON public.notifications(business_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view notifications for their business" ON public.notifications
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Function to handle new transaction notifications to be triggered by database if desired
-- (Optional, for now we handle via backend webhook or client subscription)
