# Push token registration (mobile app)

The push notification system works only for devices that have registered a push token. Registration happens in the mobile app when:

1. **User grants notification permissions**  
   The app requests notification permission (e.g. via `expo-notifications`). If the user denies, no token is obtained and no push can be sent to that device.

2. **App receives the Expo push token**  
   After permission is granted, the app calls the Expo Push API to get a device-specific token (e.g. `ExponentPushToken[xxx]`).

3. **Token gets saved to the user's record**  
   The app saves the token to Supabase in the **`push_tokens`** table (not a single `users.push_token` column). Each row is linked to the signed-in user (`user_id`) and supports multiple devices per user. The backend uses these records when sending notifications (see `send-push` Edge Function). See [PUSH_TOKENS_TABLE.md](./PUSH_TOKENS_TABLE.md) for why we use a separate table.

## Where it happens in code

- **Hook:** `hooks/usePushTokenRegistration.ts`  
  - Runs when the user is signed in (`userId` from session).  
  - Requests permission → gets Expo push token → upserts into `push_tokens` with `user_id`, `expo_push_token`, `platform`, etc.  
- **Usage:** The hook is used in `app/_layout.tsx` so every signed-in user on a compatible device gets their token registered (or updated) when the app loads.

## Requirements for registration

- **Signed-in user** – we need `user_id` to associate the token.
- **Physical device** – simulators/Expo Go do not register with the native push flow used here.
- **Development or production build** – the app must include the `expo-notifications` native module (e.g. `npx expo run:ios` or a built binary).

Until these steps complete, that user/device will not receive push notifications; the in-app Notifications list can still show messages for that user based on `notifications` and `notification_reads`.
