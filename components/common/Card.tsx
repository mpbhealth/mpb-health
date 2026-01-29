import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { responsiveSize, platformStyles } from '@/utils/scaling';
import { colors, borderRadius } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'elevated' | 'outlined' | 'filled';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  variant = 'elevated',
  style,
}) => {
  const paddingMap = {
    none: 0,
    sm: responsiveSize.sm,
    md: responsiveSize.md,
    lg: responsiveSize.lg,
  };

  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: paddingMap[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    width: '100%',
  },
  elevated: {
    backgroundColor: colors.background.default,
    ...platformStyles.shadowSm,
  },
  outlined: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filled: {
    backgroundColor: colors.gray[50],
  },
});
