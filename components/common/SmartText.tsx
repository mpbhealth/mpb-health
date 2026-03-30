import React from 'react';
import { Text, TextProps } from 'react-native';
import { moderateScale } from '@/utils/scaling';
import { maxFontSizeMultiplier as axMaxMultiplier } from '@/constants/accessibility';

const createTypography = () => ({
  display1: {
    fontSize: moderateScale(32),
    lineHeight: moderateScale(40),
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  display2: {
    fontSize: moderateScale(28),
    lineHeight: moderateScale(36),
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  h1: {
    fontSize: moderateScale(24),
    lineHeight: moderateScale(32),
    fontWeight: '700' as const,
    includeFontPadding: false,
  },
  h2: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(28),
    fontWeight: '600' as const,
    includeFontPadding: false,
  },
  h3: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(26),
    fontWeight: '600' as const,
    includeFontPadding: false,
  },
  h4: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    fontWeight: '600' as const,
    includeFontPadding: false,
  },
  body1: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    fontWeight: '400' as const,
    includeFontPadding: false,
  },
  body2: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontWeight: '400' as const,
    includeFontPadding: false,
  },
  caption: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
    fontWeight: '400' as const,
    includeFontPadding: false,
  },
  overline: {
    fontSize: moderateScale(10),
    lineHeight: moderateScale(14),
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    includeFontPadding: false,
  },
});

interface SmartTextProps extends TextProps {
  variant?: 'display1' | 'display2' | 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption' | 'overline';
  truncate?: boolean;
  maxLines?: number;
}

export const SmartText: React.FC<SmartTextProps> = ({
  children,
  variant = 'body1',
  truncate = false,
  maxLines,
  style,
  allowFontScaling,
  ...props
}) => {
  const typography = createTypography();
  const variantStyle = typography[variant];
  // Default: respect system text size / display zoom for every variant (opt out with allowFontScaling={false})
  const scaleFont = allowFontScaling ?? true;

  const minimumFontSizes: Record<string, number> = {
    display1: 22,
    display2: 20,
    h1: 18,
    h2: 16,
    h3: 14,
    h4: 13,
    body1: 13,
    body2: 12,
    caption: 10,
    overline: 9,
  };

  const adjustedStyle = {
    ...variantStyle,
    fontSize: Math.max(variantStyle.fontSize, minimumFontSizes[variant]),
  };

  const maxFontSizeMultipliers: Record<string, number> = {
    display1: axMaxMultiplier.heading,
    display2: axMaxMultiplier.heading,
    h1: axMaxMultiplier.heading,
    h2: axMaxMultiplier.heading,
    h3: axMaxMultiplier.heading,
    h4: axMaxMultiplier.heading,
    body1: axMaxMultiplier.body,
    body2: axMaxMultiplier.body,
    caption: axMaxMultiplier.caption,
    overline: axMaxMultiplier.heading,
  };

  return (
    <Text
      style={[adjustedStyle, style]}
      numberOfLines={truncate ? (maxLines || 1) : maxLines}
      ellipsizeMode={truncate ? 'tail' : undefined}
      allowFontScaling={scaleFont}
      maxFontSizeMultiplier={maxFontSizeMultipliers[variant]}
      adjustsFontSizeToFit={truncate && maxLines === 1}
      minimumFontScale={0.85}
      {...props}
    >
      {children}
    </Text>
  );
};
