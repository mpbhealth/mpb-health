import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { X, Stethoscope } from 'lucide-react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';

/** Copy shown before opening the telehealth SSO flow (home screen). */
export const TELEHEALTH_DISCLAIMER_BULLETS = [
  'Telehealth includes Urgent Care, Primary Care, Mental Health, and Pet Telehealth.',
  'Your dermatology benefit includes 3 free visits per family, per year.',
  'After that there is a $60 consultation fee.',
] as const;

interface TelehealthDisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function TelehealthDisclaimerModal({
  visible,
  onClose,
  onContinue,
}: TelehealthDisclaimerModalProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { isTablet, isLandscape } = useResponsive();

  const layout = useMemo(() => {
    const padH = responsiveSize.lg;
    const maxSheetW = Math.min(isTablet ? 520 : 460, winW - padH * 2);
    const maxSheetH = winH - insets.top - insets.bottom - padH * (isLandscape ? 1.5 : 2);
    const reserved = moderateScale(190);
    const scrollMaxH = Math.max(160, Math.min(maxSheetH - reserved, winH * (isLandscape ? 0.4 : 0.45)));

    return { maxSheetW, maxSheetH, scrollMaxH, padH };
  }, [winW, winH, insets.top, insets.bottom, isTablet, isLandscape]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        />
        <View
          style={[
            styles.sheetOuter,
            {
              paddingTop: insets.top + layout.padH * 0.75,
              paddingBottom: insets.bottom + layout.padH * 0.75,
              paddingHorizontal: layout.padH,
            },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              {
                maxWidth: layout.maxSheetW,
                maxHeight: layout.maxSheetH,
                width: '100%',
              },
            ]}
          >
            <View style={styles.accentBar} importantForAccessibility="no" />

            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Stethoscope size={moderateScale(22)} color={colors.primary.main} />
              </View>
              <View style={styles.headerText}>
                <SmartText variant="h3" style={styles.cardTitle} maxLines={2}>
                  Before you continue
                </SmartText>
                <SmartText variant="caption" style={styles.cardSubtitle} maxLines={3}>
                  Telehealth & dermatology benefit summary
                </SmartText>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={moderateScale(22)} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={[styles.scroll, { maxHeight: layout.scrollMaxH }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              overScrollMode="never"
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {TELEHEALTH_DISCLAIMER_BULLETS.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <SmartText variant="body2" style={styles.bulletText}>
                    {line}
                  </SmartText>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={onContinue}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Continue to Telehealth"
              >
                <SmartText variant="body1" style={styles.continueBtnText}>
                  Continue to Telehealth
                </SmartText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  sheetOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
    elevation: 0,
    ...(Platform.OS === 'ios' ? platformStyles.shadowLg : {}),
  },
  accentBar: {
    height: moderateScale(4),
    width: '100%',
    backgroundColor: colors.primary.main,
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveSize.lg,
    paddingTop: responsiveSize.md,
    paddingBottom: responsiveSize.sm,
    gap: responsiveSize.sm,
  },
  iconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  cardTitle: {
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: moderateScale(26),
  },
  cardSubtitle: {
    color: colors.text.secondary,
    lineHeight: moderateScale(18),
  },
  closeBtn: {
    padding: responsiveSize.xs,
    marginTop: -responsiveSize.xs,
    marginRight: -responsiveSize.xs,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: responsiveSize.lg,
    paddingBottom: responsiveSize.md,
    flexGrow: 0,
    gap: responsiveSize.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.sm,
  },
  bulletDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: colors.primary.main,
    marginTop: moderateScale(7),
    opacity: 0.85,
  },
  bulletText: {
    flex: 1,
    color: colors.text.secondary,
    lineHeight: moderateScale(22),
  },
  footer: {
    paddingHorizontal: responsiveSize.lg,
    paddingTop: responsiveSize.sm,
    paddingBottom: responsiveSize.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.background.default,
  },
  continueBtn: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: responsiveSize.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET + 2,
    elevation: 0,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  continueBtnText: {
    fontWeight: '700',
    color: colors.background.default,
  },
});
