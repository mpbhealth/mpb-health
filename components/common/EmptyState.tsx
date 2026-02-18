import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors } from '@/constants/theme';
import { responsiveSize, moderateScale } from '@/utils/scaling';

interface EmptyStateProps {
  /** Icon component (e.g. Lucide icon) rendered at moderateScale(48) */
  icon?: React.ReactNode;
  /** Main message (e.g. "No services available at this time") */
  message: string;
  /** Optional secondary line */
  subtitle?: string;
  /** Label for optional action button */
  actionLabel?: string;
  /** Called when action is pressed */
  onAction?: () => void;
}

export function EmptyState({
  icon,
  message,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <SmartText variant="body1" style={styles.message}>
        {message}
      </SmartText>
      {subtitle ? (
        <SmartText variant="body2" style={styles.subtitle}>
          {subtitle}
        </SmartText>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <SmartText variant="body1" style={styles.buttonText}>
            {actionLabel}
          </SmartText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
  },
  iconWrap: {
    marginBottom: responsiveSize.md,
    opacity: 0.6,
  },
  message: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: responsiveSize.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: responsiveSize.md,
  },
  button: {
    marginTop: responsiveSize.sm,
    paddingVertical: responsiveSize.sm,
    paddingHorizontal: responsiveSize.lg,
    borderRadius: 8,
    backgroundColor: `${colors.primary.main}12`,
  },
  buttonText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});
