import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { normalize, getLineHeight } from '@/utils/responsive';

interface ResponsiveTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption';
  adaptive?: boolean;
  minScale?: number;
  maxLines?: number;
}

/**
 * ResponsiveText component that automatically adapts to screen size and user accessibility settings
 *
 * Features:
 * - Responsive font sizing based on screen dimensions
 * - Respects user's accessibility text size settings
 * - Optional auto-scaling for long text
 * - Proper line height calculation for readability
 *
 * @param variant - Typography variant (h1, h2, h3, h4, body1, body2, caption)
 * @param adaptive - Enable auto font size adjustment (default: true)
 * @param minScale - Minimum scale factor for adaptive sizing (default: 0.85)
 * @param maxLines - Maximum number of lines before truncation
 */
export function ResponsiveText({
  variant = 'body1',
  adaptive = true,
  minScale = 0.85,
  maxLines,
  style,
  children,
  ...props
}: ResponsiveTextProps) {
  const variantStyles = getVariantStyle(variant);

  return (
    <Text
      style={[variantStyles, style]}
      adjustsFontSizeToFit={adaptive}
      minimumFontScale={minScale}
      numberOfLines={maxLines}
      ellipsizeMode={maxLines ? 'tail' : undefined}
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
}

function getVariantStyle(variant: ResponsiveTextProps['variant']): TextStyle {
  switch (variant) {
    case 'h1':
      return styles.h1;
    case 'h2':
      return styles.h2;
    case 'h3':
      return styles.h3;
    case 'h4':
      return styles.h4;
    case 'body2':
      return styles.body2;
    case 'caption':
      return styles.caption;
    case 'body1':
    default:
      return styles.body1;
  }
}

const styles = StyleSheet.create({
  h1: {
    fontSize: normalize(32),
    lineHeight: getLineHeight(normalize(32), 1.25),
    fontWeight: '700',
  },
  h2: {
    fontSize: normalize(24),
    lineHeight: getLineHeight(normalize(24), 1.33),
    fontWeight: '700',
  },
  h3: {
    fontSize: normalize(20),
    lineHeight: getLineHeight(normalize(20), 1.4),
    fontWeight: '600',
  },
  h4: {
    fontSize: normalize(18),
    lineHeight: getLineHeight(normalize(18), 1.33),
    fontWeight: '600',
  },
  body1: {
    fontSize: normalize(16),
    lineHeight: getLineHeight(normalize(16), 1.5),
    fontWeight: '400',
  },
  body2: {
    fontSize: normalize(14),
    lineHeight: getLineHeight(normalize(14), 1.43),
    fontWeight: '400',
  },
  caption: {
    fontSize: normalize(12),
    lineHeight: getLineHeight(normalize(12), 1.33),
    fontWeight: '400',
  },
});
