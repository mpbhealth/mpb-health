import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveSize } from '@/utils/scaling';

/**
 * Enterprise-safe padding for screen headers and scroll content.
 * Use for all screens so layout works on notched devices (iOS & Android) and all screen sizes.
 */
export function useSafeHeaderPadding() {
  const insets = useSafeAreaInsets();
  return {
    /** Apply to header container so title/back sit below status bar and notch */
    headerPaddingTop: Math.max(insets.top, responsiveSize.sm) + responsiveSize.sm,
    /** Apply to ScrollView contentContainerStyle paddingBottom so content clears tab bar / nav bar */
    scrollContentPaddingBottom: Math.max(insets.bottom + responsiveSize.xl, responsiveSize.xl * 2),
    /** Raw insets for modals or custom layout */
    insets,
  };
}

