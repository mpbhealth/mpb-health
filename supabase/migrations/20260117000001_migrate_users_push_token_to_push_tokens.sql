-- Migrate from single users.push_token to push_tokens table (multiple devices per user).
-- Run this if you currently have a push_token column on public.users.
-- After this, the app and send-push use push_tokens only.

-- Copy existing tokens from public.users into push_tokens (if column exists).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'push_token'
  ) THEN
    INSERT INTO public.push_tokens (user_id, expo_push_token, platform)
    SELECT id, push_token, 'migrated'
    FROM public.users
    WHERE push_token IS NOT NULL AND trim(push_token) != ''
    ON CONFLICT (user_id, expo_push_token) DO NOTHING;
  END IF;
END $$;

-- Optional: drop the old column after verifying push_tokens works.
-- Uncomment and run when ready (or run manually in SQL editor).
-- ALTER TABLE public.users DROP COLUMN IF EXISTS push_token;
