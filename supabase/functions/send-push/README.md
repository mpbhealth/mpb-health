# send-push Edge Function

Sends push notifications via the Expo Push API when given a notification id.

## Invocation

**POST** to `https://<PROJECT_REF>.supabase.co/functions/v1/send-push` with:

- Headers: `Authorization: Bearer <SUPABASE_ANON_OR_SERVICE_ROLE_KEY>`, `Content-Type: application/json`
- Body: `{ "notification_id": "<uuid>" }`

## When to call

1. **After inserting into `notifications`**  
   Use Supabase Dashboard → Database → Webhooks: create a webhook on `public.notifications` for `INSERT`, and set the webhook URL to your Edge Function URL (e.g. `https://<PROJECT_REF>.supabase.co/functions/v1/send-push`). You will need to pass the new row’s `id` in the request body (webhook payload usually includes the new record).

2. **From your backend or a cron**  
   After inserting a row into `notifications`, call this function with the new `notification_id`.

## Behavior

- Loads the notification by `notification_id`.
- Fetches tokens from the **`push_tokens`** table (not `users.push_token`): if `target_type = 'all'`, all tokens; if `target_type = 'user'`, tokens where `user_id = target_user_id`. Supports multiple devices per user.
- Sends POST requests to Expo’s push API in chunks of 100.
- Returns `{ sent, tokens }` or an error.
