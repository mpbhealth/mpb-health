# Trigger send-push when a notification is inserted

To automatically send push notifications whenever you insert a row into `notifications`, add a **Database Webhook** that calls the `send-push` Edge Function.

## Steps (Supabase Dashboard)

1. Open your project: **https://supabase.com/dashboard/project/qfigouszitcddkhssqxr**

2. Go to **Database** → **Webhooks** (in the left sidebar).

3. Click **Create a new webhook**.

4. Fill in:
   - **Name:** e.g. `on_notification_insert_send_push`
   - **Table:** `public.notifications`
   - **Events:** enable **Insert**
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:**  
     `https://qfigouszitcddkhssqxr.supabase.co/functions/v1/send-push`
   - **HTTP Headers:** click **Add header** and add:
     - **Name:** `Authorization`  
     - **Value:** `Bearer YOUR_SERVICE_ROLE_KEY`  
       (Get it from **Project Settings** → **API** → **service_role** key. Keep it secret.)

5. Leave the default **HTTP Params** / body as-is. Supabase will send a payload like:
   ```json
   { "type": "INSERT", "table": "notifications", "record": { "id": "...", "title": "...", ... } }
   ```
   The `send-push` function reads `record.id` and uses it to load the notification and send push.

6. Click **Create webhook**.

After this, every **INSERT** into `public.notifications` will trigger an HTTP POST to `send-push` with the new row; the function will send the push to the right devices.

## Optional: HTTP Params

If the dashboard lets you set a custom body, you don’t need to. The default payload already includes `record`; the Edge Function uses `body.record.id`.

## Troubleshooting

- **404 / function not found:** Ensure the Edge Function is deployed:  
  `npx supabase functions deploy send-push`
- **401:** The webhook must send the **service_role** key in the `Authorization` header.
- **No push received:** Check that the app has registered push tokens (see [PUSH_TOKENS_TABLE.md](./PUSH_TOKENS_TABLE.md)) and that the notification’s `target_type` and `target_user_id` match the intended users.
