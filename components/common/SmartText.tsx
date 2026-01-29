import React from 'react';
import { Text, TextProps, PixelRatio } from 'react-native';
import { moderateScale } from '@/utils/scaling';

const fontScale = PixelRatio.getFontScale();

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
  allowFontScaling = false,
  ...props
}) => {
  const typography = createTypography();
  const variantStyle = typography[variant];

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
    display1: fontScale > 1.3 ? 1.2 : 1.3,
    display2: fontScale > 1.3 ? 1.2 : 1.3,
    h1: fontScale > 1.3 ? 1.25 : 1.4,
    h2: fontScale > 1.3 ? 1.3 : 1.4,
    h3: fontScale > 1.3 ? 1.35 : 1.5,
    h4: fontScale > 1.3 ? 1.4 : 1.5,
    body1: fontScale > 1.3 ? 1.4 : 1.5,
    body2: fontScale > 1.3 ? 1.45 : 1.5,
    caption: fontScale > 1.3 ? 1.5 : 1.6,
    overline: fontScale > 1.3 ? 1.5 : 1.6,
  };

  return (
    <Text
      style={[adjustedStyle, style]}
      numberOfLines={truncate ? (maxLines || 1) : maxLines}
      ellipsizeMode={truncate ? 'tail' : undefined}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultipliers[variant]}
      adjustsFontSizeToFit={truncate && maxLines === 1}
      minimumFontScale={0.85}
      {...props}
    >
      {children}
    </Text>
  );
};
