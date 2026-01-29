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
          paddingTop: safeArea ? insets.top : 0,
          paddingBottom: safeArea ? insets.bottom : 0,
          paddingLeft: paddingMap[padding],
          paddingRight: paddingMap[padding],
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
