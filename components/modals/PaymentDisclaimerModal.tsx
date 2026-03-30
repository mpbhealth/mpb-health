import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { X, Shield, MessageCircle, ChevronDown } from 'lucide-react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';

interface PaymentDisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onContactConcierge?: () => void;
}

const SCROLL_FADE_H = moderateScale(36);
const SCROLL_FADE_ID = 'paymentDisclaimerScrollFade';

export function PaymentDisclaimerModal({
  visible,
  onClose,
  onContinue,
  onContactConcierge,
}: PaymentDisclaimerModalProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { isTablet, isLandscape } = useResponsive();
  const [scrollViewportH, setScrollViewportH] = useState(0);
  const [scrollContentH, setScrollContentH] = useState(0);
  const [scrollAtEnd, setScrollAtEnd] = useState(false);
  const [fadeTrackW, setFadeTrackW] = useState(0);

  const layout = useMemo(() => {
    const padH = responsiveSize.lg;
    const maxSheetW = Math.min(isTablet ? 520 : 460, winW - padH * 2);
    /** Vertical space available for the floating sheet */
    const maxSheetH = winH - insets.top - insets.bottom - padH * (isLandscape ? 1.5 : 2);
    /** Reserve space for header row, CTA block, and padding — scroll only uses what's left */
    const reserved = moderateScale(200) + (onContactConcierge ? moderateScale(52) : 0);
    const scrollMaxH = Math.max(180, Math.min(maxSheetH - reserved, winH * (isLandscape ? 0.42 : 0.48)));

    return { maxSheetW, maxSheetH, scrollMaxH, padH };
  }, [winW, winH, insets.top, insets.bottom, isTablet, isLandscape, onContactConcierge]);

  const isScrollable =
    scrollViewportH > 0 && scrollContentH > scrollViewportH + 6;
  const showBottomFade = isScrollable && !scrollAtEnd;

  const onScrollAreaLayout = useCallback((e: LayoutChangeEvent) => {
    setFadeTrackW(Math.ceil(e.nativeEvent.layout.width));
  }, []);

  const onScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    setScrollViewportH(e.nativeEvent.layout.height);
  }, []);

  const onScrollContentSizeChange = useCallback((_: number, h: number) => {
    setScrollContentH(h);
    setScrollAtEnd(false);
  }, []);

  const onBodyScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const ne = e.nativeEvent;
    const pad = moderateScale(12);
    const nearEnd =
      ne.contentOffset.y + ne.layoutMeasurement.height >= ne.contentSize.height - pad;
    setScrollAtEnd(nearEnd);
  }, []);

  useEffect(() => {
    if (visible) {
      setScrollViewportH(0);
      setScrollContentH(0);
      setScrollAtEnd(false);
    }
  }, [visible]);

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
                  <Shield size={moderateScale(22)} color={colors.primary.main} />
                </View>
                <View style={styles.headerText}>
                  <SmartText variant="h3" style={styles.cardTitle} maxLines={2}>
                    Before you continue
                  </SmartText>
                  <SmartText variant="caption" style={styles.cardSubtitle} maxLines={2}>
                    Separate login for the payment portal (security)
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

              <View
                style={[styles.scrollClip, { maxHeight: layout.scrollMaxH }]}
                onLayout={onScrollAreaLayout}
              >
                <ScrollView
                  style={[styles.scroll, { maxHeight: layout.scrollMaxH }]}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator
                  persistentScrollbar={Platform.OS === 'android'}
                  indicatorStyle="default"
                  overScrollMode="never"
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  scrollEventThrottle={16}
                  onLayout={onScrollViewLayout}
                  onContentSizeChange={onScrollContentSizeChange}
                  onScroll={onBodyScroll}
                >
                <SmartText variant="body1" style={styles.paragraph}>
                  If this is your first time using the payment portal, please note: for security reasons, the portal
                  uses a separate login.
                </SmartText>

                <SmartText variant="body2" style={styles.stepsLead}>
                  If you haven’t accessed the portal before:
                </SmartText>

                <View style={styles.steps}>
                  {[
                    'Click on "Forgot Password" on the portal login page.',
                    'Enter your email and Member ID.',
                    'You will receive an email — click the link in the email.',
                    'Set a new password. We recommend using the same password as your app for convenience.',
                  ].map((text, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <SmartText variant="caption" style={styles.stepNumberText}>
                          {i + 1}
                        </SmartText>
                      </View>
                      <SmartText variant="body2" style={styles.stepText}>
                        {text}
                      </SmartText>
                    </View>
                  ))}
                </View>

                <View style={styles.reminderBox}>
                  <SmartText variant="body2" style={styles.reminder}>
                    Changing your portal password will not affect your app login.
                  </SmartText>
                </View>

                <SmartText variant="body2" style={styles.paragraphLast}>
                  Then return here and log in to the portal. If you need help, contact Concierge.
                </SmartText>

                {onContactConcierge ? (
                  <TouchableOpacity
                    style={styles.conciergeLink}
                    onPress={onContactConcierge}
                    activeOpacity={0.8}
                  >
                    <MessageCircle size={moderateScale(18)} color={colors.primary.main} />
                    <SmartText variant="body2" style={styles.conciergeLinkText}>
                      Contact Concierge
                    </SmartText>
                  </TouchableOpacity>
                ) : null}
                </ScrollView>

                {showBottomFade && fadeTrackW > 0 ? (
                  <View style={styles.scrollFadeLayer} pointerEvents="none" accessibilityElementsHidden>
                    <Svg width={fadeTrackW} height={SCROLL_FADE_H} style={styles.scrollFadeSvg}>
                      <Defs>
                        <LinearGradient id={SCROLL_FADE_ID} x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor={colors.background.default} stopOpacity="0" />
                          <Stop offset="0.45" stopColor={colors.background.default} stopOpacity="0.65" />
                          <Stop offset="1" stopColor={colors.background.default} stopOpacity="1" />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width={fadeTrackW} height={SCROLL_FADE_H} fill={`url(#${SCROLL_FADE_ID})`} />
                    </Svg>
                    <View style={styles.scrollHintRow}>
                      <ChevronDown size={moderateScale(18)} color={colors.gray[400]} strokeWidth={2.5} />
                      <SmartText variant="caption" style={styles.scrollHintText}>
                        Scroll for more
                      </SmartText>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={onContinue}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to Payment Portal"
                >
                  <SmartText variant="body1" style={styles.continueBtnText}>
                    Continue to Payment Portal
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
  scrollClip: {
    position: 'relative',
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollFadeLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCROLL_FADE_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: moderateScale(4),
  },
  scrollFadeSvg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    opacity: 0.92,
  },
  scrollHintText: {
    color: colors.gray[500],
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: responsiveSize.lg,
    paddingBottom: responsiveSize.md,
    flexGrow: 0,
  },
  paragraph: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.md,
    lineHeight: moderateScale(22),
  },
  stepsLead: {
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: responsiveSize.sm,
  },
  steps: {
    marginBottom: responsiveSize.md,
    gap: responsiveSize.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.sm,
  },
  stepNumber: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: `${colors.primary.main}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontWeight: '700',
    color: colors.primary.main,
    fontSize: moderateScale(12),
  },
  stepText: {
    flex: 1,
    color: colors.text.secondary,
    lineHeight: moderateScale(21),
  },
  reminderBox: {
    backgroundColor: `${colors.primary.main}0c`,
    borderRadius: borderRadius.md,
    padding: responsiveSize.md,
    borderWidth: 1,
    borderColor: `${colors.primary.main}22`,
    marginBottom: responsiveSize.md,
  },
  reminder: {
    color: colors.text.primary,
    fontWeight: '600',
    lineHeight: moderateScale(20),
  },
  paragraphLast: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.sm,
    lineHeight: moderateScale(21),
  },
  conciergeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    paddingVertical: responsiveSize.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  conciergeLinkText: {
    fontWeight: '600',
    color: colors.primary.main,
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
