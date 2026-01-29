import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro, common reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Calculate scale factors
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(widthScale, heightScale);

/**
 * Normalize font size based on screen dimensions and pixel density
 * This ensures text scales appropriately across different devices
 * and respects user's accessibility text size settings
 */
export function normalize(size: number, factor: number = 0.5): number {
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }

  // Android applies its own font scaling, so we apply a smaller factor
  return Math.round(PixelRatio.roundToNearestPixel(newSize - (factor * (newSize - size))));
}

/**
 * Get responsive width based on percentage of screen width
 */
export function wp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
}

/**
 * Get responsive height based on percentage of screen height
 */
export function hp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
}

/**
 * Responsive spacing values
 */
export const responsiveSpacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(12),
  lg: normalize(16),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
};

/**
 * Responsive font sizes that adapt to screen size and user settings
 */
export const responsiveFonts = {
  xs: normalize(10),
  sm: normalize(12),
  md: normalize(14),
  base: normalize(16),
  lg: normalize(18),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(28),
  huge: normalize(32),
};

/**
 * Check if device is a tablet
 */
export function isTablet(): boolean {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (Platform.OS === 'ios' && aspectRatio < 1.6) ||
    (Platform.OS === 'android' && SCREEN_WIDTH >= 600)
  );
}

/**
 * Get adaptive line height based on font size
 * Ensures text is readable with proper spacing
 */
export function getLineHeight(fontSize: number, multiplier: number = 1.4): number {
  return Math.round(fontSize * multiplier);
}
