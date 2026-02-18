/**
 * On Android: lock to portrait on phones (width < 768), allow rotation on large screens (tablets/foldables).
 * Satisfies Google Play's requirement to remove orientation restrictions for large screens while keeping
 * portrait-only UX on phones. No-op on iOS (handled by manifest/Info.plist).
 * No-ops when native module is unavailable (e.g. Expo Go or before native rebuild).
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

const LARGE_SCREEN_WIDTH_PX = 768;

function getScreenOrientation(): typeof import('expo-screen-orientation') | null {
  try {
    return require('expo-screen-orientation');
  } catch {
    return null;
  }
}

export function useScreenOrientationLock(screenWidth: number) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const ScreenOrientation = getScreenOrientation();
    if (!ScreenOrientation) return;

    const isLargeScreen = screenWidth >= LARGE_SCREEN_WIDTH_PX;

    if (isLargeScreen) {
      ScreenOrientation.unlockAsync().catch(() => {});
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT).catch(() => {});
    }
  }, [screenWidth]);
}
