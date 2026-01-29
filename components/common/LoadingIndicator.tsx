import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors } from '@/constants/theme';
import { responsiveSize } from '@/utils/scaling';

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message = 'Loading...' }: LoadingIndicatorProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator
        size="large"
        color={colors.primary.main}
        style={styles.spinner}
      />
      <SmartText variant="body1" style={styles.text} maxLines={1}>{message}</SmartText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.background.paper}F2`, // semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  spinner: {
    marginBottom: responsiveSize.md,
  },
  text: {
    color: colors.text.secondary,
  },
});
