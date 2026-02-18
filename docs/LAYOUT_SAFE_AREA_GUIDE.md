# Layout & Safe Area Guide

This app uses a consistent pattern so every screen works on **all Android and iOS devices** (notches, punch-holes, different sizes) without layout issues.

## Hook: `useSafeHeaderPadding()`

**Location:** `hooks/useSafeHeaderPadding.ts`

Use this on every screen that has a header and/or scroll content:

- **`headerPaddingTop`** – Apply to the header container so the title/back button sit below the status bar and notch. Use: `style={[styles.header, { paddingTop: headerPaddingTop }]}`.
- **`scrollContentPaddingBottom`** – Apply to `ScrollView`’s `contentContainerStyle` so content clears the tab bar / nav bar. Use: `contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}`.
- **`insets`** – Raw insets for modals or custom layout.

## Per-screen checklist

1. **Import and call the hook**
   ```ts
   import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
   // in component:
   const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
   ```

2. **Header**
   - Add dynamic top padding: `style={[styles.header, { paddingTop: headerPaddingTop }]}` (or a `headerStyle` variable used everywhere that screen has a header).
   - Remove any static `paddingTop: Platform.OS === 'ios' ? 60 : 40` from `styles.header`.
   - Optional: use header shadow only on iOS: `...(Platform.OS === 'ios' ? platformStyles.shadowSm : {})`.

3. **ScrollView**
   - Add `overScrollMode="never"` (cleaner on Android).
   - Add bottom padding: `contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}` (or merge with existing).

4. **Flex / overflow**
   - For flex children that contain text, add `flex: 1, minWidth: 0` (or at least `minWidth: 0`) so long text doesn’t overflow.
   - Header content wrapper: `minWidth: 0` so the title truncates instead of overlapping.

## Screens already updated

- **Tabs:** Home (index), Profile, Chat  
- **Stack:** Plan Details, Care, Member Information, Payment History, What to Do, Notifications, Notification Detail, My Advisor, Member Services, Discounts, Labs Testing, Privacy Policy  
- **Plans:** Essentials, Care Plus, Secure HSA  
- **Auth:** Sign In  

## Screens still using static header padding

Apply the same pattern above to:

- `app/payment-disclaimer.tsx`
- `app/sharing.tsx`
- `app/telehealth-sso.tsx`
- `app/rx-card.tsx`
- `app/profile-settings/index.tsx`, `change-password.tsx`, `change-email.tsx`
- `app/plans/direct.tsx`, `mec-plus-essentials.tsx`, `premium-care.tsx`, `premium-hsa.tsx`
- `app/hospital-debt-relief.tsx`
- `app/healthy-podcast.tsx`
- `app/chatWithConcierge.tsx`
- `app/auth/update-password.tsx`, `reset-password.tsx`, `member-support.tsx`, `forgot-password.tsx`, `create-account.tsx`
- `app/auth/email-confirm.tsx`, `app/auth/sign-up.tsx` (may use insets differently)
- `app/activate-dependent-account.tsx`
- `app/activate-dependents.tsx` (uses `moderateScale(60)`)

## Container component

`components/layout/Container.tsx` uses safe area insets for top, bottom, **and** left/right so content respects notches and curved edges when `safeArea={true}`.

## Android display cutout

`android/app/src/main/res/values-v28/styles.xml` sets `windowLayoutInDisplayCutoutMode` to `shortEdges` so the app receives correct insets on notched/punch-hole devices (Android 9+).
