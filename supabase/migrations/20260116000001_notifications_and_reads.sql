-- Notifications table: store notification payloads and targeting (broadcast vs specific user)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('all', 'user')),
  target_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  route text NULL,
  type text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'Push and in-app notifications; target_type all = every member, user = single user';
COMMENT ON COLUMN public.notifications.target_user_id IS 'Required when target_type = user; references users.id (auth)';

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON public.notifications(target_type, target_user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read notifications targeted to 'all' or to themselves
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    target_type = 'all'
    OR target_user_id = auth.uid()
  );

-- Only service role can insert/update/delete (admin/backend)
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE
  TO service_role
  USING (true);

-- notification_reads: per-user read state
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON public.notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON public.notification_reads(notification_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_reads_select_policy" ON public.notification_reads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notification_reads_insert_policy" ON public.notification_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_reads_update_policy" ON public.notification_reads
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notification_reads_delete_policy" ON public.notification_reads
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
