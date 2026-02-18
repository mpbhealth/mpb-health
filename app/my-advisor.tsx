import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { Phone, Mail, User, Star, Copy } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';
import { logger } from '@/lib/logger';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const logoImg = require('../assets/images/logo.png');

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Advisor {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export default function MyAdvisorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();

  const { userData, loading: userLoading } = useUserData();
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    async function fetchAdvisor() {
      if (userLoading) return;

      if (!userData?.agent_id) {
        setLoading(false);
        return;
      }

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
        setError('Unable to load advisor information');
      } finally {
        setLoading(false);
      }
    }

    fetchAdvisor();
  }, [userData?.agent_id, userLoading]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'web') {
      alert(`${label} copied to clipboard`);
    } else {
      Alert.alert('Copied to clipboard', text);
    }
  }, []);

  const handleCall = useCallback(async () => {
    if (!advisor?.phone) return;

    const telURL = `tel:${advisor.phone}`;
    try {
      const canOpen = await Linking.canOpenURL(telURL);
      if (canOpen) {
        await Linking.openURL(telURL);
      } else {
        throw new Error('Cannot make call');
      }
    } catch {
      Alert.alert('Cannot Make Call', 'Your device does not support phone calls. Tap the copy icon to copy the number.');
    }
  }, [advisor?.phone]);

  const handleEmail = useCallback(async () => {
    if (!advisor?.email) return;

    const mailURL = `mailto:${advisor.email}`;
    try {
      const canOpen = await Linking.canOpenURL(mailURL);
      if (canOpen) {
        await Linking.openURL(mailURL);
      } else {
        throw new Error('Cannot send email');
      }
    } catch {
      Alert.alert('Cannot Send Email', 'Your device does not support email. Tap the copy icon to copy the address.');
    }
  }, [advisor?.email]);

  const advisorFullName = useMemo(() => {
    if (!advisor) return '';
    return `${advisor.first_name} ${advisor.last_name}`;
  }, [advisor]);

  const isLoading = userLoading || loading;

  if (isLoading) return <LoadingIndicator />;

  if (showFeedbackForm && advisor) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.header, { paddingTop: headerPaddingTop }]} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => setShowFeedbackForm(false)} />
          <SmartText variant="h2" style={styles.screenTitle} maxLines={1}>Rate Your Advisor</SmartText>
        </Animated.View>

        <View style={styles.advisorHeader}>
          <SmartText variant="body2" style={styles.advisorHeaderLabel} maxLines={1}>Your Advisor:</SmartText>
          <SmartText variant="h3" style={styles.advisorHeaderName} maxLines={2}>{advisorFullName}</SmartText>
        </View>

        <View style={styles.webviewWrapper}>
          <WebViewContainer url="https://www.cognitoforms.com/MPoweringBenefits1/HealthcareAdvisorFeedback" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { paddingTop: headerPaddingTop }]} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.screenTitle} maxLines={1}>My Advisor</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.logoContainer} entering={FadeInDown.delay(200)}>
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {error ? (
          <Animated.View entering={FadeInUp.delay(300)}>
            <Card padding="lg" variant="outlined" style={styles.messageCard}>
              <SmartText variant="body1" style={styles.messageText} maxLines={3}>{error}</SmartText>
            </Card>
          </Animated.View>
        ) : !advisor ? (
          <Animated.View entering={FadeInUp.delay(300)}>
            <Card padding="lg" variant="outlined" style={styles.messageCard}>
              <SmartText variant="body1" style={styles.messageText} maxLines={3}>No advisor assigned. Please contact Concierge.</SmartText>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(300)}>
          <Card padding="lg" variant="elevated" style={isTablet ? { ...styles.advisorCard, ...styles.advisorCardWide } : styles.advisorCard}>
            <View style={styles.avatar}>
                <User size={moderateScale(40)} color={colors.primary.main} />
              </View>

              <SmartText variant="h3" style={styles.name} maxLines={2}>{advisorFullName}</SmartText>
              <SmartText variant="body2" style={styles.role} maxLines={1}>Healthcare Advisor</SmartText>

              <View style={[styles.contactSection, isTablet && styles.contactSectionWide]}>
                <AnimatedTouchable
                  entering={FadeInUp.delay(400)}
                  style={styles.actionButton}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Phone size={moderateScale(24)} color={colors.primary.main} />
                  </View>
                  <View style={styles.textBox}>
                    <SmartText variant="caption" style={styles.contactLabel} maxLines={1}>Call Advisor</SmartText>
                    <View style={styles.contactRow}>
                      <SmartText variant="body1" style={styles.contactValue} maxLines={1}>
                        {advisor.phone}
                      </SmartText>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(advisor.phone, 'Phone number')}
                        style={styles.copyBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Copy size={moderateScale(16)} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </AnimatedTouchable>

                <AnimatedTouchable
                  entering={FadeInUp.delay(500)}
                  style={styles.actionButton}
                  onPress={handleEmail}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Mail size={moderateScale(24)} color={colors.primary.main} />
                  </View>
                  <View style={styles.textBox}>
                    <SmartText variant="caption" style={styles.contactLabel} maxLines={1}>Email Advisor</SmartText>
                    <View style={styles.contactRow}>
                      <SmartText variant="body1" style={styles.contactValue} maxLines={1}>
                        {advisor.email}
                      </SmartText>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(advisor.email, 'Email address')}
                        style={styles.copyBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Copy size={moderateScale(16)} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </AnimatedTouchable>
              </View>

              <View style={styles.infoBox}>
                <SmartText variant="h4" style={styles.infoTitle} maxLines={2}>How They Help You</SmartText>
                <SmartText variant="body2" style={styles.infoLine} maxLines={2}>• Personalized membership guidance</SmartText>
                <SmartText variant="body2" style={styles.infoLine} maxLines={2}>• Education on medical cost sharing & membership features</SmartText>
                <SmartText variant="body2" style={styles.infoLine} maxLines={2}>• Support through enrollment</SmartText>
                <SmartText variant="body2" style={styles.infoLine} maxLines={2}>• Guidance if your healthcare needs change</SmartText>
              </View>
            </Card>
          </Animated.View>
        )}

        {advisor && (
          <Animated.View entering={FadeInUp.delay(600)}>
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => setShowFeedbackForm(true)}
              activeOpacity={0.8}
            >
              <Star size={moderateScale(20)} color={colors.background.default} />
              <SmartText variant="body1" style={styles.rateButtonText} maxLines={1}>Rate Your Experience</SmartText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    backgroundColor: colors.background.default,
    paddingBottom: responsiveSize.md,
    paddingHorizontal: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  screenTitle: {
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveSize.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: responsiveSize.xl,
  },
  logo: {
    width: moderateScale(160),
    height: moderateScale(45),
  },
  messageCard: {
    backgroundColor: rgbaFromHex(colors.status.error, 0.06),
    borderColor: rgbaFromHex(colors.status.error, 0.2),
    marginBottom: responsiveSize.xl,
  },
  messageText: {
    color: colors.status.error,
    textAlign: 'center',
  },
  advisorCard: {
    marginBottom: responsiveSize.lg,
    alignItems: 'center',
  },
  advisorCardWide: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  avatar: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
    ...platformStyles.shadowSm,
  },
  name: {
    color: colors.text.primary,
    marginBottom: responsiveSize.xs,
    textAlign: 'center',
    fontWeight: '700',
  },
  role: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xl,
    textAlign: 'center',
  },
  contactSection: {
    width: '100%',
    marginBottom: responsiveSize.lg,
  },
  contactSectionWide: {
    flexDirection: 'row',
    gap: responsiveSize.md,
  },
  actionButton: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.md,
    minHeight: MIN_TOUCH_TARGET * 1.8,
    ...platformStyles.shadowSm,
  },
  iconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.md,
    flexShrink: 0,
  },
  textBox: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xs / 2,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
  },
  contactValue: {
    color: colors.primary.main,
    fontWeight: '600',
    flexShrink: 1,
  },
  copyBtn: {
    padding: responsiveSize.xs,
    flexShrink: 0,
  },
  infoBox: {
    backgroundColor: rgbaFromHex(colors.primary.main, 0.08),
    borderRadius: borderRadius.lg,
    padding: responsiveSize.lg,
    width: '100%',
  },
  infoTitle: {
    color: colors.primary.main,
    marginBottom: responsiveSize.md,
    fontWeight: '700',
  },
  infoLine: {
    color: colors.text.primary,
    marginBottom: responsiveSize.xs,
  },
  rateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary.main,
    paddingVertical: responsiveSize.md,
    paddingHorizontal: responsiveSize.lg,
    borderRadius: borderRadius.lg,
    marginBottom: responsiveSize.lg,
    minHeight: MIN_TOUCH_TARGET,
    gap: responsiveSize.xs,
    ...platformStyles.shadow,
  },
  rateButtonText: {
    color: colors.background.default,
    fontWeight: '600',
  },
  advisorHeader: {
    backgroundColor: colors.background.default,
    padding: responsiveSize.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  advisorHeaderLabel: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xs,
  },
  advisorHeaderName: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  webviewWrapper: {
    flex: 1,
  },
});
