import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Phone, Mail, User, Star, Copy } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { logger } from '@/lib/logger';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const logoImg = require('../assets/images/logo.png');

const ANDROID = Platform.OS === 'android';

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
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

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
        <Animated.View style={[styles.header, !ANDROID && shadows.sm]} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => setShowFeedbackForm(false)} />
          <Text style={styles.screenTitle}>Rate Your Advisor</Text>
        </Animated.View>

        <View style={styles.advisorHeader}>
          <Text style={styles.advisorHeaderLabel}>Your Advisor:</Text>
          <Text style={styles.advisorHeaderName}>{advisorFullName}</Text>
        </View>

        <View style={styles.webviewWrapper}>
          <WebViewContainer url="https://www.cognitoforms.com/MPoweringBenefits1/HealthcareAdvisorFeedback" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, !ANDROID && shadows.sm]} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.screenTitle}>My Advisor</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.logoContainer} entering={FadeInDown.delay(200)}>
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {error ? (
          <Animated.View style={styles.messageCard} entering={FadeInUp.delay(300)}>
            <Text style={styles.messageText}>{error}</Text>
          </Animated.View>
        ) : !advisor ? (
          <Animated.View style={styles.messageCard} entering={FadeInUp.delay(300)}>
            <Text style={styles.messageText}>No advisor assigned. Please contact Concierge.</Text>
          </Animated.View>
        ) : (
          <Animated.View
            style={[styles.advisorCard, isWide && styles.advisorCardWide, !ANDROID && shadows.md]}
            entering={FadeInUp.delay(300)}
          >
            <View style={[styles.avatar, !ANDROID && shadows.sm]}>
              <User size={40} color={colors.primary.main} />
            </View>

            <Text style={styles.name}>{advisorFullName}</Text>
            <Text style={styles.role}>Healthcare Advisor</Text>

            <View style={[styles.contactSection, isWide && styles.contactSectionWide]}>
              <AnimatedTouchable
                entering={FadeInUp.delay(400)}
                style={[styles.actionButton, !ANDROID && shadows.sm]}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Phone size={24} color={colors.primary.main} />
                </View>
                <View style={styles.textBox}>
                  <Text style={styles.contactLabel}>Call Advisor</Text>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {advisor.phone}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(advisor.phone, 'Phone number')}
                      style={styles.copyBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Copy size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedTouchable>

              <AnimatedTouchable
                entering={FadeInUp.delay(500)}
                style={[styles.actionButton, !ANDROID && shadows.sm]}
                onPress={handleEmail}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Mail size={24} color={colors.primary.main} />
                </View>
                <View style={styles.textBox}>
                  <Text style={styles.contactLabel}>Email Advisor</Text>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {advisor.email}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(advisor.email, 'Email address')}
                      style={styles.copyBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Copy size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedTouchable>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>How They Help You</Text>
              <Text style={styles.infoLine}>• Personalized membership guidance</Text>
              <Text style={styles.infoLine}>• Education on medical cost sharing & membership features</Text>
              <Text style={styles.infoLine}>• Support through enrollment</Text>
              <Text style={styles.infoLine}>• Guidance if your healthcare needs change</Text>
            </View>
          </Animated.View>
        )}

        {advisor && (
          <Animated.View entering={FadeInUp.delay(600)}>
            <TouchableOpacity
              style={[styles.rateButton, !ANDROID && shadows.md]}
              onPress={() => setShowFeedbackForm(true)}
              activeOpacity={0.8}
            >
              <Star size={20} color={colors.background.default} />
              <Text style={styles.rateButtonText}>Rate Your Experience</Text>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  screenTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logo: {
    width: 160,
    height: 45,
  },
  messageCard: {
    backgroundColor: `${colors.status.error}10`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  messageText: {
    ...typography.body1,
    color: colors.status.error,
    textAlign: 'center',
  },
  advisorCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...(ANDROID && {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: rgbaFromHex(colors.gray[400], 0.28),
    }),
  },
  advisorCardWide: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontWeight: '700',
  },
  role: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  contactSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  contactSectionWide: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 80,
    flex: 1,
    ...(ANDROID && {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: rgbaFromHex(colors.gray[400], 0.28),
    }),
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  textBox: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactValue: {
    ...typography.body1,
    color: colors.primary.main,
    fontWeight: '600',
    flex: 1,
  },
  copyBtn: {
    padding: spacing.xs,
    flexShrink: 0,
  },
  infoBox: {
    backgroundColor: `${colors.primary.main}08`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  infoTitle: {
    ...typography.h4,
    color: colors.primary.main,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  infoLine: {
    ...typography.body2,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  rateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  rateButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  advisorHeader: {
    backgroundColor: colors.background.default,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  advisorHeaderLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  advisorHeaderName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  webviewWrapper: {
    flex: 1,
  },
});
