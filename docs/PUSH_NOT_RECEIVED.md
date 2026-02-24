# Why didn't I receive a push for a notification in the table?

Follow this checklist.

## 1. Was the Edge Function called when you inserted the row?

**If you did NOT set up a Database Webhook**, inserting into `notifications` does **not** call `send-push`. The row is stored but no push is sent.

**Fix (choose one):**

- **Option A – Set up the webhook** so future inserts trigger push automatically:  
  See [DATABASE_WEBHOOK_SEND_PUSH.md](./DATABASE_WEBHOOK_SEND_PUSH.md).

- **Option B – Manually send for the existing notification**  
  In Supabase Dashboard → **Edge Functions** → **send-push** → **Invoke**, or run:

  ```bash
  curl -X POST 'https://qfigouszitcddkhssqxr.supabase.co/functions/v1/send-push' \
    -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
    -H 'Content-Type: application/json' \
    -d '{"notification_id": "PASTE_THE_NOTIFICATION_UUID_HERE"}'
  ```

  Replace `YOUR_SERVICE_ROLE_KEY` (Project Settings → API → service_role) and `PASTE_THE_NOTIFICATION_UUID_HERE` with the `id` of the row in the `notifications` table.

  If the function returns `{ "sent": 0, "message": "No valid push tokens" }`, go to step 2.

## 2. Do you have a device token in `push_tokens`?

Push can only be delivered to devices that have registered an Expo push token. Registration happens in the app when: (1) the user grants notification permissions, (2) the app receives the Expo push token, (3) the token is saved to the user's record. See [PUSH_TOKEN_REGISTRATION.md](./PUSH_TOKEN_REGISTRATION.md) for details.

- **Supabase Dashboard** → **Table Editor** → **push_tokens**  
  Check if there is at least one row with your **user_id** (the same as your auth user id / `users.id`).

- **No rows or no row for your user?**
  - The app only registers a token when:
    1. You are **signed in** (so we have a `user_id`).
    2. The app is running in a **development build** (e.g. `npx expo run:ios` or `npx expo run:android`), **not** in Expo Go. Expo Go cannot register for push with our setup.
  - So: build and run the app with `npx expo run:ios` (or android), sign in, open the app once (and allow notifications when prompted). Then check `push_tokens` again; you should see a row with your `user_id` and an `expo_push_token`.

## 3. Does the notification target you?

- If the row has **target_type = 'all'**, it is sent to every token in `push_tokens`.
- If **target_type = 'user'**, it is sent only to tokens where **user_id = target_user_id**.  
  So `target_user_id` must be your auth user id (same as `users.id` for your account).

Check the notification row: `target_type` and (if user) `target_user_id` must match how you’re testing.

## 4. In-app list only (no push)

Even with no push tokens, the notification will **show in the app’s Notifications screen** for the right users (target_type = 'all' or target_user_id = you). So you can confirm the row and targeting are correct there.

---

**Summary:** Inserting a row only sends a push if (1) the Edge Function is called (webhook or manual invoke) and (2) there is at least one device token in `push_tokens` for the targeted user(s). Use a dev build and sign in to register a token; use the webhook or manual invoke to trigger send-push.
