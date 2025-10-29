import { Platform } from 'react-native';

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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
};

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
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const
  }
};