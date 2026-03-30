import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import {
  Phone,
  Mail,
  Star,
  Copy,
  RefreshCw,
  MessageCircle,
  Check,
  AlertCircle,
  UserRound,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles, cardChromeSm } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';
import { logger } from '@/lib/logger';
import { screenChrome } from '@/utils/screenChrome';
import {
  hubScreenHeader,
  hubHeaderA11y,
  hubScreenScroll,
  hubScreenStates,
} from '@/utils/hubListScreenLayout';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(first?: string | null, last?: string | null) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'A';
}

interface Advisor {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

const FEEDBACK_FORM_URL = 'https://www.cognitoforms.com/MPoweringBenefits1/HealthcareAdvisorFeedback';

const HELP_POINTS = [
  'Personalized membership guidance',
  'Education on medical cost sharing and your benefits',
  'Support through enrollment and life changes',
] as const;

export default function MyAdvisorScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();

  const { userData, loading: userLoading } = useUserData();
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    async function fetchAdvisor() {
      if (userLoading) return;

      if (!userData?.agent_id) {
        setAdvisor(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('advisors')
          .select('first_name, last_name, phone, email')
          .eq('agent_id', userData.agent_id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setAdvisor(data);
      } catch (err) {
        logger.error('Error fetching advisor', err);
        setError('Unable to load advisor information. Check your connection and try again.');
        setAdvisor(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAdvisor();
  }, [userData?.agent_id, userLoading, reloadToken]);

  const retry = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${label} copied to clipboard`);
    } else if (Platform.OS !== 'web') {
      Alert.alert('Copied to clipboard', text);
    }
  }, []);

  const handleCall = useCallback(async () => {
    if (!advisor?.phone) return;
    const telURL = `tel:${advisor.phone.replace(/\s/g, '')}`;
    try {
      const canOpen = await Linking.canOpenURL(telURL);
      if (canOpen) await Linking.openURL(telURL);
      else throw new Error('Cannot make call');
    } catch {
      Alert.alert('Cannot Make Call', 'Use the copy button to copy the number.');
    }
  }, [advisor?.phone]);

  const handleEmail = useCallback(async () => {
    if (!advisor?.email) return;
    const mailURL = `mailto:${advisor.email}`;
    try {
      const canOpen = await Linking.canOpenURL(mailURL);
      if (canOpen) await Linking.openURL(mailURL);
      else throw new Error('Cannot send email');
    } catch {
      Alert.alert('Cannot Send Email', 'Use the copy button to copy the address.');
    }
  }, [advisor?.email]);

  const advisorFullName = useMemo(() => {
    if (!advisor) return '';
    return `${advisor.first_name} ${advisor.last_name}`.trim();
  }, [advisor]);

  const initials = useMemo(
    () => (advisor ? getInitials(advisor.first_name, advisor.last_name) : ''),
    [advisor]
  );

  const isLoading = userLoading || loading;

  const headerBar = (options: { onBack: () => void; title: string }) => (
    <Animated.View
      style={[hubScreenHeader.bar, { paddingTop: headerPaddingTop }]}
      entering={FadeInDown.delay(80)}
    >
      <BackButton onPress={options.onBack} />
      <View style={hubScreenHeader.content}>
        <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
          {options.title}
        </SmartText>
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={screenChrome.container}>
        {headerBar({ onBack: () => router.back(), title: 'My Advisor' })}
        <View style={hubScreenStates.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={hubScreenStates.loadingText}>
            Loading your advisor…
          </SmartText>
        </View>
      </View>
    );
  }

  if (showFeedbackForm && advisor) {
    return (
      <View style={screenChrome.container}>
        {headerBar({ onBack: () => setShowFeedbackForm(false), title: 'Feedback' })}
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackChip}>
            <SmartText variant="caption" style={styles.feedbackChipText}>
              Rating · {advisorFullName}
            </SmartText>
          </View>
          <SmartText variant="body2" style={styles.feedbackSub}>
            Share your experience — it helps us support you better.
          </SmartText>
        </View>
        <View style={styles.webviewWrapper}>
          <WebViewContainer url={FEEDBACK_FORM_URL} />
        </View>
      </View>
    );
  }

  return (
    <View style={screenChrome.container}>
      {headerBar({ onBack: () => router.back(), title: 'My Advisor' })}

      <ScrollView
        style={[hubScreenScroll.content, hubScreenScroll.contentShade]}
        overScrollMode="never"
        contentContainerStyle={[
          screenChrome.scrollContent,
          styles.scrollOuter,
          { paddingBottom: scrollContentPaddingBottom + responsiveSize.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[hubScreenScroll.maxWidthContainer, isTablet && hubScreenScroll.tabletMaxWidth]}>
          {error ? (
            <Animated.View entering={FadeInUp.delay(120)} style={styles.stateBlock}>
              <View style={[styles.stateIconWrap, styles.stateIconWrapError]}>
                <AlertCircle size={moderateScale(28)} color={colors.status.error} />
              </View>
              <SmartText variant="h3" style={styles.stateTitle}>
                Something went wrong
              </SmartText>
              <SmartText variant="body1" style={styles.stateBody}>
                {error}
              </SmartText>
              <TouchableOpacity style={styles.primaryFilled} onPress={retry} accessibilityRole="button">
                <RefreshCw size={moderateScale(18)} color={colors.background.default} />
                <SmartText variant="body1" style={styles.primaryFilledLabel}>
                  Try again
                </SmartText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.textLinkRow}
                onPress={() => router.push('/chatWithConcierge' as never)}
                accessibilityRole="button"
              >
                <MessageCircle size={moderateScale(18)} color={colors.primary.main} />
                <SmartText variant="body1" style={styles.textLinkLabel}>
                  Contact Concierge
                </SmartText>
              </TouchableOpacity>
            </Animated.View>
          ) : !advisor ? (
            <Animated.View entering={FadeInUp.delay(120)} style={styles.stateBlock}>
              <View style={[styles.stateIconWrap, styles.stateIconWrapNeutral]}>
                <UserRound size={moderateScale(32)} color={colors.primary.main} />
              </View>
              <SmartText variant="h3" style={styles.stateTitle}>
                No advisor yet
              </SmartText>
              <SmartText variant="body1" style={styles.stateBody}>
                When an advisor is assigned to your membership, their contact details will appear here. Concierge can help in the meantime.
              </SmartText>
              <TouchableOpacity
                style={styles.primaryFilled}
                onPress={() => router.push('/chatWithConcierge' as never)}
                accessibilityRole="button"
              >
                <MessageCircle size={moderateScale(20)} color={colors.background.default} />
                <SmartText variant="body1" style={styles.primaryFilledLabel}>
                  Chat with Concierge
                </SmartText>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(100)} style={styles.heroShell}>
                <View style={styles.heroGlow} />
                <SmartText variant="overline" style={styles.heroKicker}>
                  Your dedicated contact
                </SmartText>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(140)} style={styles.heroCard}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatar}>
                    <SmartText variant="h1" style={styles.avatarInitials}>
                      {initials}
                    </SmartText>
                  </View>
                </View>
                <SmartText variant="h2" style={styles.heroName}>
                  {advisorFullName}
                </SmartText>
                <View style={styles.rolePill}>
                  <Star size={moderateScale(12)} color={colors.secondary.dark} fill={colors.secondary.light} />
                  <SmartText variant="caption" style={styles.rolePillText}>
                    Healthcare advisor
                  </SmartText>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(180)} style={styles.section}>
                <SmartText variant="overline" style={styles.sectionLabel}>
                  Get in touch
                </SmartText>
                <View style={[styles.contactGrid, isTablet && styles.contactGridTablet]}>
                  <AnimatedTouchable
                    style={[styles.contactTile, isTablet && styles.contactTileTablet]}
                    onPress={handleCall}
                    activeOpacity={0.72}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${advisorFullName}`}
                    entering={FadeInUp.delay(200)}
                  >
                    <View style={[styles.contactTileIcon, { backgroundColor: rgbaFromHex(colors.primary.main, 0.12) }]}>
                      <Phone size={moderateScale(22)} color={colors.primary.main} strokeWidth={2.2} />
                    </View>
                    <View style={styles.contactTileBody}>
                      <SmartText variant="caption" style={styles.contactTileLabel}>
                        Phone
                      </SmartText>
                      <SmartText variant="body1" style={styles.contactTileValue}>
                        {advisor.phone}
                      </SmartText>
                    </View>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(advisor.phone, 'Phone number')}
                      style={styles.copyFab}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Copy phone number"
                    >
                      <Copy size={moderateScale(16)} color={colors.gray[500]} />
                    </TouchableOpacity>
                  </AnimatedTouchable>

                  <AnimatedTouchable
                    style={[styles.contactTile, isTablet && styles.contactTileTablet]}
                    onPress={handleEmail}
                    activeOpacity={0.72}
                    accessibilityRole="button"
                    accessibilityLabel={`Email ${advisorFullName}`}
                    entering={FadeInUp.delay(240)}
                  >
                    <View style={[styles.contactTileIcon, { backgroundColor: rgbaFromHex(colors.secondary.main, 0.18) }]}>
                      <Mail size={moderateScale(22)} color={colors.secondary.dark} strokeWidth={2.2} />
                    </View>
                    <View style={styles.contactTileBody}>
                      <SmartText variant="caption" style={styles.contactTileLabel}>
                        Email
                      </SmartText>
                      <SmartText variant="body1" style={styles.contactTileValue}>
                        {advisor.email}
                      </SmartText>
                    </View>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(advisor.email, 'Email address')}
                      style={styles.copyFab}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Copy email address"
                    >
                      <Copy size={moderateScale(16)} color={colors.gray[500]} />
                    </TouchableOpacity>
                  </AnimatedTouchable>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(280)}>
                <Card padding="lg" variant="outlined" style={styles.infoCard}>
                  <SmartText variant="h4" style={styles.infoCardTitle}>
                    How your advisor helps
                  </SmartText>
                  {HELP_POINTS.map((line) => (
                    <View key={line} style={styles.helpRow}>
                      <View style={styles.helpCheck}>
                        <Check size={moderateScale(14)} color={colors.primary.main} strokeWidth={3} />
                      </View>
                      <SmartText variant="body2" style={styles.helpText}>
                        {line}
                      </SmartText>
                    </View>
                  ))}
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(320)}>
                <TouchableOpacity
                  style={styles.rateCard}
                  onPress={() => setShowFeedbackForm(true)}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Rate your advisor experience"
                >
                  <View style={styles.rateIconCircle}>
                    <Star size={moderateScale(24)} color={colors.secondary.main} fill={rgbaFromHex(colors.secondary.main, 0.25)} />
                  </View>
                  <View style={styles.rateTextCol}>
                    <SmartText variant="body1" style={styles.rateCardTitle}>
                      Rate your experience
                    </SmartText>
                    <SmartText variant="body2" style={styles.rateCardSub}>
                      Quick feedback — opens a short secure form
                    </SmartText>
                  </View>
                  <ChevronRight size={moderateScale(22)} color={colors.secondary.dark} style={styles.rateChevron} />
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollOuter: {
    paddingHorizontal: responsiveSize.md,
  },
  heroShell: {
    marginHorizontal: -responsiveSize.md,
    paddingHorizontal: responsiveSize.md,
    paddingTop: responsiveSize.md,
    paddingBottom: moderateScale(56),
    backgroundColor: rgbaFromHex(colors.primary.main, 0.06),
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: -moderateScale(44),
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: rgbaFromHex(colors.secondary.main, 0.06),
    opacity: 0.9,
  },
  heroKicker: {
    color: colors.primary.dark,
    letterSpacing: 1.2,
    marginTop: responsiveSize.xs,
  },
  heroCard: {
    marginHorizontal: responsiveSize.xs,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    paddingVertical: responsiveSize.xl,
    paddingHorizontal: responsiveSize.lg,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[100],
    ...cardChromeSm,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    marginBottom: responsiveSize.md,
  },
  avatar: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.background.default,
    fontWeight: '700',
  },
  heroName: {
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: responsiveSize.sm,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: rgbaFromHex(colors.secondary.main, 0.14),
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.xs,
    borderRadius: borderRadius.full,
  },
  rolePillText: {
    color: colors.secondary.dark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: {
    marginTop: responsiveSize.lg,
    marginBottom: responsiveSize.md,
  },
  sectionLabel: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.sm,
    letterSpacing: 1,
  },
  contactGrid: {
    gap: responsiveSize.md,
  },
  contactGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactTile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
    minHeight: MIN_TOUCH_TARGET * 1.45,
    gap: responsiveSize.md,
    ...cardChromeSm,
  },
  contactTileTablet: {
    flex: 1,
    minWidth: moderateScale(280),
  },
  contactTileIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contactTileBody: {
    flex: 1,
    minWidth: 0,
  },
  contactTileLabel: {
    color: colors.text.secondary,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactTileValue: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  copyFab: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  infoCard: {
    borderColor: colors.gray[200],
    backgroundColor: colors.background.default,
    marginBottom: responsiveSize.lg,
  },
  infoCardTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: responsiveSize.md,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.sm,
    marginBottom: responsiveSize.sm,
  },
  helpCheck: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  helpText: {
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.lg,
    borderWidth: 2,
    borderColor: rgbaFromHex(colors.secondary.main, 0.45),
    gap: responsiveSize.md,
    minHeight: MIN_TOUCH_TARGET + 8,
    ...Platform.select({
      ios: platformStyles.shadowSm,
      default: {},
    }),
  },
  rateIconCircle: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: rgbaFromHex(colors.secondary.main, 0.12),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rateTextCol: {
    flex: 1,
    minWidth: 0,
  },
  rateCardTitle: {
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  rateCardSub: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  rateChevron: {
    flexShrink: 0,
    opacity: 0.85,
  },
  feedbackHeader: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  feedbackChip: {
    alignSelf: 'flex-start',
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    paddingHorizontal: responsiveSize.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: responsiveSize.sm,
  },
  feedbackChipText: {
    color: colors.primary.dark,
    fontWeight: '700',
  },
  feedbackSub: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  stateBlock: {
    alignItems: 'center',
    paddingVertical: responsiveSize.xxl,
    paddingHorizontal: responsiveSize.sm,
  },
  stateIconWrap: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
  },
  stateIconWrapError: {
    backgroundColor: rgbaFromHex(colors.status.error, 0.1),
  },
  stateIconWrapNeutral: {
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
  },
  stateTitle: {
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: responsiveSize.sm,
  },
  stateBody: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: responsiveSize.xl,
    maxWidth: 360,
  },
  primaryFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.sm,
    backgroundColor: colors.primary.main,
    paddingVertical: responsiveSize.md,
    paddingHorizontal: responsiveSize.xl,
    borderRadius: borderRadius.lg,
    minWidth: 200,
    minHeight: MIN_TOUCH_TARGET,
    ...Platform.select({
      ios: platformStyles.shadowSm,
      default: {},
    }),
  },
  primaryFilledLabel: {
    color: colors.background.default,
    fontWeight: '700',
  },
  textLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
    marginTop: responsiveSize.lg,
    paddingVertical: responsiveSize.sm,
  },
  textLinkLabel: {
    color: colors.primary.main,
    fontWeight: '700',
  },
});
