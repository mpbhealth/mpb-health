import * as React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { moderateScale, responsiveSize } from '@/utils/scaling';

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

/**
 * Use on screens inside `app/(tabs)/` only.
 * - iOS **NativeTabs** (Liquid Glass): no `BottomTabBarHeightContext`; add reserve so scroll content
 *   and actions stay above the system tab bar.
 * - Android **JS Tabs**: adds measured tab height when the navigator reports it (translucent / scroll-under cases).
 */
export function useTabScreenSafePadding() {
  const base = useSafeHeaderPadding();
  const tabBarHeight = React.useContext(BottomTabBarHeightContext);

  let tabBarOverlapReserve = 0;
  if (Platform.OS === 'ios') {
    // NativeTabs: context is undefined — reserve space below scroll content for UITabBar / Liquid Glass.
    // JS bottom tabs on iOS: use the navigator-reported height when present.
    tabBarOverlapReserve =
      tabBarHeight == null ? moderateScale(58) + responsiveSize.md : tabBarHeight;
  }

  return {
    ...base,
    scrollContentPaddingBottom: base.scrollContentPaddingBottom + tabBarOverlapReserve,
  };
}

