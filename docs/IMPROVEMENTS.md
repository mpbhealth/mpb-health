# MPB Health – Improvements Roadmap

Recommendations to keep the app **up to date**, **consistent**, and **great on all screen sizes and settings** (iOS & Android), plus **visual/UX enhancements**.

---

## 1. iOS & Android parity

### Done
- Safe area insets on key screens (see `LAYOUT_SAFE_AREA_GUIDE.md`).
- Shadows/elevation: iOS-only (no Android elevation) to avoid unwanted shadows.
- Android display cutout support (notches) via `values-v28/styles.xml`.
- Tab bar and BackButton already platform-aware.

### To do
- **Finish safe area on remaining screens**  
  ~20 screens still use static `paddingTop: 60/40`. Use `useSafeHeaderPadding()` and apply `headerPaddingTop` / `scrollContentPaddingBottom` as in the layout guide. List: payment-disclaimer, sharing, telehealth-sso, rx-card, profile-settings (3), plans (direct, mec-plus-essentials, premium-care, premium-hsa), hospital-debt-relief, healthy-podcast, chatWithConcierge, auth (update-password, reset-password, member-support, forgot-password, create-account, email-confirm, sign-up), activate-dependent-account, activate-dependents.
- **Target SDK**  
  Keep `targetSdkVersion` (e.g. 35) and iOS deployment target in sync with store requirements and test on latest OS versions.

---

## 2. Any screen size and system settings

### Screen size
- **Done:** Scaling via `moderateScale` / `responsiveSize`, `useResponsive()` (tablet/extra-small), `useWindowDimensions()`, flex with `minWidth: 0` to avoid overflow.
- **Optional:** Use `ScreenLayout` (or the same header + scroll pattern) on every screen so small/large phones and tablets all get safe area + consistent padding.

### System settings (accessibility)
- **Font size:**  
  - `SmartText` currently uses `allowFontScaling={false}` and `maxFontSizeMultiplier`.  
  - **Improvement:** Allow font scaling for body/caption (e.g. `allowFontScaling={true}` with a cap like `maxFontSizeMultiplier={1.35}`) so “Large text” / “Font size” in system settings is respected without breaking layout.
- **Display size (Android):**  
  Layout already uses density-independent scaling; testing on “Large” and “Largest” display size is recommended.
- **Reduce motion:**  
  Optional: respect `AccessibilityInfo.isReduceMotionEnabled()` and tone down or skip entrance/transition animations when enabled.

---

## 3. Consistent layout across all pages

### Patterns to standardize
- **Header:** Same structure everywhere: safe top padding (`headerPaddingTop`), back (or close), title (with `flex: 1, minWidth: 0`), optional actions. No fixed `60/40` padding.
- **Scroll content:** `ScrollView` with `overScrollMode="never"` (Android), bottom padding `scrollContentPaddingBottom`, and consistent horizontal padding (e.g. `responsiveSize.md` or from hook).
- **Cards / lists:** Use shared `Card` and same padding (e.g. `responsiveSize.md`). Avoid mixing raw `shadows.*` and `platformStyles`; stick to theme + `Card` so shadows stay iOS-only everywhere.
- **Empty states:** Use a single `EmptyState` component (icon + message + optional action) so “No services”, “No notifications”, etc. look and behave the same.
- **Loading:** Prefer one pattern (e.g. full-screen `LoadingIndicator` or inline spinner) so users see a consistent loading experience.

### Implementation
- **`ScreenLayout`** (`components/layout/ScreenLayout.tsx`): Use on any screen for a consistent shell—safe-area header (back + title) + scroll with padding. Example:
  ```tsx
  <ScreenLayout title="Screen Name" onBack={() => router.back()}>
    <YourContent />
  </ScreenLayout>
  ```
- **`EmptyState`** (`components/common/EmptyState.tsx`): Use for “no data” views. Example:
  ```tsx
  <EmptyState
    icon={<Inbox size={moderateScale(48)} color={colors.gray[400]} />}
    message="No notifications at the moment."
    actionLabel="Contact Concierge"
    onAction={() => router.push('/chatWithConcierge')}
  />
  ```
- When adding new screens, follow the checklist in `LAYOUT_SAFE_AREA_GUIDE.md` and use `ScreenLayout` where it fits.

---

## 4. Visual and UX enhancements

### High impact
- **Empty states:** Use the shared `EmptyState` component (icon, message, optional action). Use on Care, Discounts, Labs, Member Services, Notifications, etc. for a consistent look.
- **Pull-to-refresh:** Already on Home; add where it makes sense (e.g. Notifications, Care, Discounts, Member Services) for list/content screens.
- **Loading states:** Where possible, use skeleton placeholders (e.g. profile card, list rows) instead of only a spinner so layout doesn’t jump.
- **Haptics:** Light haptic on important actions (e.g. “Continue”, “Submit”, tab change) on supported devices. BackButton already uses haptics on iOS.

### Medium impact
- **Focus and accessibility:** Ensure all tappable elements have `accessibilityRole` and `accessibilityLabel` (and `accessibilityHint` where helpful). Add visible focus ring on Android for keyboard/talkBack.
- **Error and success feedback:** Toasts or inline banners for “Saved”, “Copied”, “Error” so feedback is consistent and visible.
- **Consistent spacing:** Use only `responsiveSize` (or theme spacing) for margins/padding; avoid magic numbers like `16`, `24` unless they come from the design system.

### Nice to have
- **Micro-interactions:** Small scale or opacity animation on card/list press (some screens already use this).
- **Section dividers:** Subtle dividers or spacing between sections for long scrollable screens.
- **Illustrations:** Optional illustration or icon in empty states and error views to make them friendlier.

---

## 5. Quick reference

| Area              | Action |
|-------------------|--------|
| New screen        | Use `useSafeHeaderPadding()`, apply header + scroll padding, add `overScrollMode="never"`, use `Card` / theme. |
| Empty list        | Use `EmptyState` (icon + message + optional CTA). |
| Buttons / cards   | Rely on theme + `platformStyles` (shadows are iOS-only). No extra `elevation` on Android. |
| Forms             | Wrap in `KeyboardAvoidingView` with `behavior="padding"` (iOS) and optional `keyboardVerticalOffset`. |
| Text              | Prefer `SmartText`; enable font scaling for body/caption with a max multiplier for accessibility. |

---

## 6. Files to touch (by priority)

1. **Layout:** Remaining screens in `LAYOUT_SAFE_AREA_GUIDE.md` → add `useSafeHeaderPadding()` and remove static header padding.
2. **Components:** `SmartText` (font scaling), new `EmptyState`, optional `ScreenLayout`.
3. **Consistency:** Replace ad-hoc empty views with `EmptyState`; ensure all ScrollViews use `overScrollMode="never"` and safe bottom padding.
