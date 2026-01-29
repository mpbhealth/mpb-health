import { Dimensions, Platform, PixelRatio } from 'react-native';

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreenDimensions();

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const MIN_SCALE = 0.85;
const MAX_SCALE = 1.3;

const EXTRA_SMALL_WIDTH = 320;
const LARGE_WIDTH = 428;

export const scale = (size: number) => {
  const currentWidth = Dimensions.get('window').width;

  if (currentWidth <= EXTRA_SMALL_WIDTH) {
    const scaled = (currentWidth / BASE_WIDTH) * size;
    return Math.max(size * 0.80, Math.min(scaled, size * MAX_SCALE));
  }

  if (currentWidth >= LARGE_WIDTH) {
    const scaled = (currentWidth / BASE_WIDTH) * size;
    return Math.max(size * MIN_SCALE, Math.min(scaled, size * 1.2));
  }

  const scaled = (currentWidth / BASE_WIDTH) * size;
  return Math.max(size * MIN_SCALE, Math.min(scaled, size * MAX_SCALE));
};

export const verticalScale = (size: number) => {
  const currentHeight = Dimensions.get('window').height;
  const scaled = (currentHeight / BASE_HEIGHT) * size;
  return Math.max(size * MIN_SCALE, Math.min(scaled, size * MAX_SCALE));
};

export const moderateScale = (size: number, factor = 0.5) => {
  const scaledSize = scale(size);
  return size + (scaledSize - size) * factor;
};

export const MIN_TOUCH_TARGET = 44;

export const responsiveSize = {
  xs: moderateScale(8),
  sm: moderateScale(12),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

export const platformStyles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),

  shadowSm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),

  shadowMd: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),

  shadowLg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),

  buttonPadding: Platform.select({
    ios: responsiveSize.md,
    android: responsiveSize.sm,
    default: responsiveSize.md,
  }),

  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    default: 44,
  }),
};
