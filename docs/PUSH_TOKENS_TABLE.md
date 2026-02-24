# Push tokens: `push_tokens` table (not `users.push_token`)

The app and the `send-push` Edge Function use a **`push_tokens`** table so that:

- **Multiple devices per user** – A user can receive notifications on phone and tablet; each device has its own row.
- **Better token lifecycle** – Tokens can be updated or removed per device without touching the user row.
- **Platform per token** – Each row can store `platform` (e.g. `ios` / `android`) for analytics or targeting.

## Schema

| Column            | Description                                      |
|-------------------|--------------------------------------------------|
| `id`              | UUID primary key                                 |
| `user_id`         | References `auth.users(id)`; who owns this token |
| `expo_push_token` | Expo push token (e.g. `ExponentPushToken[xxx]`)  |
| `device_id`       | Optional device identifier                       |
| `platform`        | Optional `ios` / `android`                       |
| `created_at`      | When the token was first registered              |
| `updated_at`      | Last update                                      |

Unique on `(user_id, expo_push_token)` so the same device can be re-registered without duplicates.

## Where it’s used

- **App:** `hooks/usePushTokenRegistration.ts` upserts into `push_tokens` (with `user_id`, `expo_push_token`, `platform`, etc.).
- **Backend:** `send-push` Edge Function reads from `push_tokens` (all tokens for `target_type = 'all'`, or by `user_id` when `target_type = 'user'`).

There is **no** `users.push_token` column in this design; all tokens live in `push_tokens`.

## If you currently have `users.push_token`

If your database still has a single `push_token` column on `users`:

1. **Apply the migration** that creates `push_tokens` (if not already applied):  
   `supabase/migrations/20260116000002_push_tokens.sql`

2. **Migrate existing tokens** into `push_tokens`:  
   `supabase/migrations/20260117000001_migrate_users_push_token_to_push_tokens.sql`  
   This copies every non-empty `users.push_token` into `push_tokens` (with `platform = 'migrated'`) so existing devices keep receiving pushes.

3. **Deploy the Edge Function** that reads from `push_tokens`:  
   `npx supabase functions deploy send-push`

4. **Optional:** After confirming pushes work, drop the old column:  
   `ALTER TABLE public.users DROP COLUMN IF EXISTS push_token;`

After this, the app and `send-push` use only `push_tokens`.
