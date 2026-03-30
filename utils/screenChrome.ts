import { StyleSheet, Platform, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';

/**
 * Shared “modern stack” chrome (no light/dark theme): paper canvas, hairline header rule,
 * roomy horizontal inset, optional tablet reading width.
 */
export const screenChrome = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  scrollContent: {
    paddingHorizontal: responsiveSize.lg,
    paddingTop: responsiveSize.md,
    flexGrow: 1,
  },
  /** When a screen already uses extra bottom padding in contentContainerStyle */
  scrollContentLooseBottom: {
    paddingHorizontal: responsiveSize.lg,
    paddingTop: responsiveSize.md,
    paddingBottom: responsiveSize.xl,
    flexGrow: 1,
  },
  maxWidth: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 900,
  },
  title: {
    flex: 1,
    marginLeft: responsiveSize.xs,
    color: colors.text.primary,
    fontWeight: '700',
    minWidth: 0,
  },
  headerTitleColumn: {
    flex: 1,
    marginLeft: responsiveSize.xs,
    minWidth: 0,
    justifyContent: 'center',
  },
  overline: {
    color: colors.primary.main,
    marginBottom: moderateScale(2),
    opacity: 0.95,
  },
});

/** Standard stack header: white bar + hairline bottom + iOS shadow only */
export function screenHeaderRow(paddingTop: number): ViewStyle {
  return {
    backgroundColor: colors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
    paddingTop,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  };
}

/** Headers that still use uniform `padding` instead of top from safe area only */
export function screenHeaderRowPadded(paddingTop: number): ViewStyle {
  return {
    backgroundColor: colors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop,
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  };
}
