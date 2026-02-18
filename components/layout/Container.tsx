import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveSize } from '@/utils/scaling';

interface ContainerProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  safeArea?: boolean;
  maxWidth?: number;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  padding = 'md',
  safeArea = true,
  maxWidth,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const paddingMap = {
    none: 0,
    sm: responsiveSize.sm,
    md: responsiveSize.md,
    lg: responsiveSize.lg,
  };

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: safeArea ? Math.max(insets.top, paddingMap[padding]) : 0,
          paddingBottom: safeArea ? Math.max(insets.bottom, paddingMap[padding]) : 0,
          paddingLeft: safeArea ? Math.max(insets.left, paddingMap[padding]) : paddingMap[padding],
          paddingRight: safeArea ? Math.max(insets.right, paddingMap[padding]) : paddingMap[padding],
          maxWidth: maxWidth || undefined,
          alignSelf: 'center',
          width: '100%',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
