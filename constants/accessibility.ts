/**
 * maxFontSizeMultiplier caps how far text grows vs the default size when users
 * use large / largest accessibility text (iOS Dynamic Type, Android font size).
 * Values are high enough for very large system settings while reducing runaway
 * layout breakage; pair with ScrollView + flexShrink on text containers.
 */
export const maxFontSizeMultiplier = {
  /** Display & nav-style headings */
  heading: 2.65,
  /** Body copy, labels, buttons */
  body: 2.9,
  /** Fine print: still readable when enlarged */
  caption: 2.85,
} as const;

/**
 * Defaults for raw React Native `Text` / `TextInput` (set once in root `_layout`).
 * Per-component props override these when set explicitly (e.g. `SmartText`, badges).
 */
export const defaultAccessibleTextProps = {
  allowFontScaling: true as const,
  maxFontSizeMultiplier: maxFontSizeMultiplier.body,
};
