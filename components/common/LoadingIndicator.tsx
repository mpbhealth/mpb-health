import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing } from '@/constants/theme';

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
      <Text style={styles.text}>{message}</Text>
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
    marginBottom: spacing.md,
  },
  text: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
