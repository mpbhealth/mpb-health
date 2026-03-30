/**
 * Shared layout tokens for member hub screens (Care, Sharing, Discounts, Labs, Member Forms, etc.)
 * so headers, scroll areas, and list rows stay visually consistent.
 */

import { Platform, StyleSheet } from 'react-native';
import { colors, typography, borderRadius } from '@/constants/theme';
import {
  responsiveSize,
  moderateScale,
  MIN_TOUCH_TARGET,
  platformStyles,
  cardChromeSm,
} from '@/utils/scaling';

export const hubScreenHeader = StyleSheet.create({
  bar: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  content: {
    flex: 1,
    marginLeft: responsiveSize.xs,
    minWidth: 0,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  detailTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

/** Two lines before ellipsis — helps large Dynamic Type and long titles in hub headers */
export const hubHeaderA11y = {
  screenTitle: { numberOfLines: 2 as const, ellipsizeMode: 'tail' as const },
  detailTitle: { numberOfLines: 2 as const, ellipsizeMode: 'tail' as const },
} as const;

export const hubScreenScroll = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentShade: {
    backgroundColor: colors.background.subtle,
  },
  scrollPad: {
    paddingHorizontal: responsiveSize.md,
  },
  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },
  description: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: responsiveSize.lg,
    lineHeight: 22,
    flexShrink: 1,
    width: '100%',
  },
  listGap: {
    gap: responsiveSize.md,
    marginBottom: responsiveSize.lg,
  },
});

/** Standard hub list row: white card, icon + text + trailing affordance */
export const hubListRow = StyleSheet.create({
  card: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
    ...cardChromeSm,
  },
  rowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: responsiveSize.sm,
    minWidth: 0,
    gap: responsiveSize.sm,
  },
  iconTile: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  iconTileCompact: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs + 2,
  },
  /** Distinct from description: larger type + heavy weight + tight tracking */
  rowTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  rowDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    lineHeight: 20,
    flexShrink: 1,
  },
  openHint: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 4,
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
  },
});

export const hubScreenStates = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
    gap: responsiveSize.md,
    backgroundColor: colors.background.subtle,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
    gap: responsiveSize.md,
    backgroundColor: colors.background.subtle,
  },
  errorTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
    minHeight: MIN_TOUCH_TARGET,
    elevation: 0,
    ...(Platform.OS === 'ios' ? platformStyles.shadow : {}),
  },
  retryButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.background.default,
  },
});
