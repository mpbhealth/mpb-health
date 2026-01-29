import { Platform } from 'react-native';
import { normalize, getLineHeight, responsiveSpacing } from '@/utils/responsive';

export const colors = {
  // Brand Colors
  primary: {
    main: '#0071BC', // Royal/cobalt blue
    light: '#3391CF',
    dark: '#005A96',
    contrast: '#FFFFFF'
  },
  secondary: {
    main: '#8DC63F', // Gradient lime/green
    light: '#A3D465',
    dark: '#719F32',
    contrast: '#FFFFFF'
  },
  // Supporting Colors
  gray: {
    50: '#F1F5F9',
    100: '#E2E8F0',
    200: '#CBD5E1',
    300: '#94A3B8',
    400: '#64748B',
    500: '#475569',
    600: '#334155',
    700: '#1E293B',
    800: '#0F172A',
    900: '#020617'
  },
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    disabled: '#94A3B8'
  },
  background: {
    default: '#FFFFFF',
    paper: '#F1F5F9',
    subtle: '#F8FAFC'
  },
  status: {
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0891B2'
  }
};

// Edge-to-edge safe area handling
export const edgeToEdge = {
  getStatusBarHeight: (insets: { top: number }) => {
    return Platform.OS === 'android' ? Math.max(insets.top, 24) : insets.top;
  }
};

export const spacing = responsiveSpacing;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8
  }
};

export const typography = {
  h1: {
    fontSize: normalize(32),
    lineHeight: getLineHeight(normalize(32), 1.25),
    fontWeight: '700' as const
  },
  h2: {
    fontSize: normalize(24),
    lineHeight: getLineHeight(normalize(24), 1.33),
    fontWeight: '700' as const
  },
  h3: {
    fontSize: normalize(20),
    lineHeight: getLineHeight(normalize(20), 1.4),
    fontWeight: '600' as const
  },
  h4: {
    fontSize: normalize(18),
    lineHeight: getLineHeight(normalize(18), 1.33),
    fontWeight: '600' as const
  },
  body1: {
    fontSize: normalize(16),
    lineHeight: getLineHeight(normalize(16), 1.5),
    fontWeight: '400' as const
  },
  body2: {
    fontSize: normalize(14),
    lineHeight: getLineHeight(normalize(14), 1.43),
    fontWeight: '400' as const
  },
  caption: {
    fontSize: normalize(12),
    lineHeight: getLineHeight(normalize(12), 1.33),
    fontWeight: '400' as const
  }
};