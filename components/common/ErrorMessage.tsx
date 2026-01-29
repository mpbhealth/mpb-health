import { View, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale } from '@/utils/scaling';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${message}`}
    >
      <AlertCircle size={moderateScale(16)} color={colors.status.error} />
      <SmartText variant="body2" style={styles.text} maxLines={2}>{message}</SmartText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}10`,
    padding: responsiveSize.md,
    borderRadius: borderRadius.md,
    marginBottom: responsiveSize.md,
    gap: responsiveSize.sm,
  },
  text: {
    color: colors.status.error,
    flex: 1,
    minWidth: 0,
  },
});
